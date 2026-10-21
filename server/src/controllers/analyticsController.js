import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { istDay } from './trackController.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000;

// Midnight (India time) of an IST calendar day string, as a real Date.
const istStart = (day) => new Date(`${day}T00:00:00+05:30`);
// IST calendar day string for a Date.
const dayOf = (d) => istDay(d);
const monthOf = (d) => istDay(d).slice(0, 7);

// Last `n` calendar months (oldest first) as 'YYYY-MM', ending with this month.
function lastMonths(n) {
  const [y, m] = istDay().slice(0, 7).split('-').map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const total = y * 12 + (m - 1) - i;
    out.push(`${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`);
  }
  return out;
}

const sumRevenue = (orders) => orders.reduce((s, o) => s + o.totalPrice, 0);

// GET /api/admin/analytics?days=30 — admin+.
// Everything the dashboard shows: revenue (with previous-period comparison and
// today / month / year totals), orders, visitors, customers, conversion,
// payment mix, product engagement (views, wishlist likes/unlikes, bag adds)
// and review sentiment. Cancelled orders are excluded from revenue and
// top-sellers (never fulfilled) but still counted in statusCounts.
// Visitor/engagement data comes from tables added by a later migration; if
// they are missing the rest of the dashboard still loads.
export const getAnalytics = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const now = new Date();
  const since = new Date(now.getTime() - days * DAY_MS);
  const prevSince = new Date(since.getTime() - days * DAY_MS);
  const today = istDay(now);
  const monthStartDay = `${today.slice(0, 7)}-01`;
  const yearStartDay = `${today.slice(0, 4)}-01-01`;
  const sinceDay = dayOf(since);
  const prevSinceDay = dayOf(prevSince);

  const months12 = lastMonths(12);
  const monthsStart = istStart(`${months12[0]}-01`);

  const [
    ordersTwoWindows, statusGroups, topGrouped, ordersYear,
    allTimeAgg, totalCustomers, newCustomers, prevNewCustomers,
    newSubscribers, returnsCount, reviewGroups, reviewAgg,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: prevSince } },
      select: { totalPrice: true, status: true, createdAt: true, paymentMethod: true },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { status: true }, where: { createdAt: { gte: since } } }),
    prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      _sum: { qty: true },
      where: { order: { createdAt: { gte: since }, status: { not: 'cancelled' } } },
      orderBy: { _sum: { qty: 'desc' } },
      take: 10,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: monthsStart < istStart(yearStartDay) ? monthsStart : istStart(yearStartDay) }, status: { not: 'cancelled' } },
      select: { totalPrice: true, createdAt: true },
    }),
    prisma.order.aggregate({ _sum: { totalPrice: true }, _count: { _all: true }, where: { status: { not: 'cancelled' } } }),
    prisma.user.count({ where: { role: 'user' } }),
    prisma.user.count({ where: { role: 'user', createdAt: { gte: since } } }),
    prisma.user.count({ where: { role: 'user', createdAt: { gte: prevSince, lt: since } } }),
    prisma.subscriber.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.returnRequest.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.review.groupBy({ by: ['rating'], _count: { rating: true }, where: { approved: true, createdAt: { gte: since } } }).catch(() => []),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true }, where: { approved: true, createdAt: { gte: since } } }).catch(() => null),
  ]);

  // ── orders: current vs previous window ──
  const current = ordersTwoWindows.filter((o) => o.createdAt >= since);
  const previous = ordersTwoWindows.filter((o) => o.createdAt < since);
  const counted = current.filter((o) => o.status !== 'cancelled');
  const countedPrev = previous.filter((o) => o.status !== 'cancelled');
  const revenue = sumRevenue(counted);
  const prevRevenue = sumRevenue(countedPrev);

  const byDay = new Map();
  for (const o of counted) {
    const key = dayOf(o.createdAt);
    byDay.set(key, (byDay.get(key) || 0) + o.totalPrice);
  }
  const revenueByDay = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, total }));

  // ── revenue today / this month / this year / all time, plus last 12 months ──
  const sumFrom = (list, fromDay) => {
    const from = istStart(fromDay);
    const rows = list.filter((o) => o.createdAt >= from);
    return { revenue: sumRevenue(rows), orders: rows.length };
  };
  const periods = {
    today: sumFrom(ordersYear, today),
    month: sumFrom(ordersYear, monthStartDay),
    year: sumFrom(ordersYear, yearStartDay),
    allTime: { revenue: allTimeAgg._sum.totalPrice || 0, orders: allTimeAgg._count._all },
  };
  const monthMap = new Map(months12.map((m) => [m, { month: m, total: 0, orders: 0 }]));
  for (const o of ordersYear) {
    const row = monthMap.get(monthOf(o.createdAt));
    if (row) { row.total += o.totalPrice; row.orders += 1; }
  }
  const revenueByMonth = [...monthMap.values()];

  // ── top-selling ──
  const topIds = topGrouped.map((t) => t.productId);
  const meta = topIds.length
    ? await prisma.product.findMany({ where: { id: { in: topIds } }, select: { id: true, images: true, stock: true, price: true } })
    : [];
  const metaById = new Map(meta.map((p) => [p.id, p]));
  const topProducts = topGrouped.map((t) => ({
    productId: t.productId,
    name: t.name,
    qtySold: t._sum.qty,
    image: metaById.get(t.productId)?.images?.[0] || '',
    price: metaById.get(t.productId)?.price ?? null,
    currentStock: metaById.get(t.productId)?.stock ?? null,
  }));

  // ── visitors (unique per day; month/year are distinct across days) ──
  let visitors = null;
  try {
    const [totals, dailyRows, monthlyRows, yearlyRows, windowRow, prevRow] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          COUNT(DISTINCT "visitorId") FILTER (WHERE day = ${today})::int         AS today,
          COUNT(DISTINCT "visitorId") FILTER (WHERE day >= ${monthStartDay})::int AS month,
          COUNT(DISTINCT "visitorId")::int                                        AS year
        FROM "SiteVisit" WHERE day >= ${yearStartDay}`,
      prisma.$queryRaw`
        SELECT day, COUNT(*)::int AS visitors, COALESCE(SUM(views),0)::int AS visits
        FROM "SiteVisit" WHERE day >= ${sinceDay} GROUP BY day ORDER BY day`,
      prisma.$queryRaw`
        SELECT substr(day,1,7) AS month, COUNT(DISTINCT "visitorId")::int AS visitors, COALESCE(SUM(views),0)::int AS visits
        FROM "SiteVisit" WHERE day >= ${`${months12[0]}-01`} GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw`
        SELECT substr(day,1,4) AS year, COUNT(DISTINCT "visitorId")::int AS visitors, COALESCE(SUM(views),0)::int AS visits
        FROM "SiteVisit" GROUP BY 1 ORDER BY 1`,
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT "visitorId")::int AS visitors, COALESCE(SUM(views),0)::int AS visits
        FROM "SiteVisit" WHERE day >= ${sinceDay}`,
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT "visitorId")::int AS visitors
        FROM "SiteVisit" WHERE day >= ${prevSinceDay} AND day < ${sinceDay}`,
    ]);

    // Fill quiet days with 0 so the daily chart has no misleading gaps
    // (only for ranges short enough to draw one bar per day).
    let daily = [];
    if (days <= 90) {
      const have = new Map(dailyRows.map((r) => [r.day, r]));
      for (let i = days - 1; i >= 0; i--) {
        const d = dayOf(new Date(now.getTime() - i * DAY_MS));
        daily.push({ date: d, visitors: have.get(d)?.visitors || 0, visits: have.get(d)?.visits || 0 });
      }
    }
    const mHave = new Map(monthlyRows.map((r) => [r.month, r]));
    visitors = {
      today: totals[0]?.today || 0,
      month: totals[0]?.month || 0,
      year: totals[0]?.year || 0,
      window: windowRow[0]?.visitors || 0,
      windowVisits: windowRow[0]?.visits || 0,
      prevWindow: prevRow[0]?.visitors || 0,
      daily,
      monthly: months12.map((m) => ({ month: m, visitors: mHave.get(m)?.visitors || 0, visits: mHave.get(m)?.visits || 0 })),
      yearly: yearlyRows.map((r) => ({ year: r.year, visitors: r.visitors, visits: r.visits })),
    };
  } catch {
    visitors = null; // tracking tables not created yet
  }

  // ── product engagement: views, wishlist likes/unlikes, bag adds ──
  let engagement = null;
  try {
    const events = await prisma.productEvent.groupBy({
      by: ['productId', 'type'],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    });
    const perProduct = new Map();
    const totals = { views: 0, likes: 0, unlikes: 0, cartAdds: 0 };
    for (const e of events) {
      const row = perProduct.get(e.productId) || { productId: e.productId, views: 0, likes: 0, unlikes: 0, cartAdds: 0 };
      const n = e._count._all;
      if (e.type === 'view') { row.views += n; totals.views += n; }
      else if (e.type === 'wishlist_add') { row.likes += n; totals.likes += n; }
      else if (e.type === 'wishlist_remove') { row.unlikes += n; totals.unlikes += n; }
      else if (e.type === 'cart_add') { row.cartAdds += n; totals.cartAdds += n; }
      perProduct.set(e.productId, row);
    }
    const rows = [...perProduct.values()]
      .sort((a, b) => (b.likes * 3 + b.cartAdds * 2 + b.views) - (a.likes * 3 + a.cartAdds * 2 + a.views))
      .slice(0, 12);
    const ids = rows.map((r) => r.productId);
    const [prods, sold, ratings] = ids.length
      ? await Promise.all([
          prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, images: true } }),
          prisma.orderItem.groupBy({
            by: ['productId'], _sum: { qty: true },
            where: { productId: { in: ids }, order: { createdAt: { gte: since }, status: { not: 'cancelled' } } },
          }),
          prisma.review.groupBy({
            by: ['productId'], _avg: { rating: true }, _count: { rating: true },
            where: { productId: { in: ids }, approved: true },
          }).catch(() => []),
        ])
      : [[], [], []];
    const pById = new Map(prods.map((p) => [p.id, p]));
    const soldById = new Map(sold.map((s) => [s.productId, s._sum.qty || 0]));
    const rById = new Map(ratings.map((r) => [r.productId, r]));
    engagement = {
      totals,
      products: rows
        .filter((r) => pById.has(r.productId)) // skip products that have since been deleted
        .map((r) => ({
          ...r,
          name: pById.get(r.productId).name,
          image: pById.get(r.productId).images?.[0] || '',
          sold: soldById.get(r.productId) || 0,
          avgRating: rById.get(r.productId)?._avg.rating ? Number(rById.get(r.productId)._avg.rating.toFixed(1)) : null,
          reviews: rById.get(r.productId)?._count.rating || 0,
        })),
    };
  } catch {
    engagement = null;
  }

  // ── reviews sentiment (4–5 stars positive, 1–2 negative) ──
  const rc = Object.fromEntries(reviewGroups.map((g) => [g.rating, g._count.rating]));
  const reviews = {
    count: reviewAgg?._count._all || 0,
    avg: reviewAgg?._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : null,
    positive: (rc[4] || 0) + (rc[5] || 0),
    neutral: rc[3] || 0,
    negative: (rc[1] || 0) + (rc[2] || 0),
  };

  // ── payment mix, cancellations ──
  const payment = { cod: { orders: 0, revenue: 0 }, online: { orders: 0, revenue: 0 } };
  for (const o of counted) {
    const k = o.paymentMethod === 'online' ? 'online' : 'cod';
    payment[k].orders += 1;
    payment[k].revenue += o.totalPrice;
  }
  const cancelledCount = current.length - counted.length;

  const orderCount = counted.length;
  const conversionRate = visitors && visitors.window > 0 ? Number(((orderCount / visitors.window) * 100).toFixed(1)) : null;

  res.json({
    days,
    revenue,
    totalOrders: current.length,
    avgOrderValue: orderCount ? Math.round(revenue / orderCount) : 0,
    statusCounts: Object.fromEntries(statusGroups.map((s) => [s.status, s._count.status])),
    topProducts,
    revenueByDay,
    prev: {
      revenue: prevRevenue,
      totalOrders: previous.length,
      avgOrderValue: countedPrev.length ? Math.round(prevRevenue / countedPrev.length) : 0,
      visitors: visitors?.prevWindow ?? null,
      newCustomers: prevNewCustomers,
    },
    periods,
    revenueByMonth,
    visitors,
    trackingReady: visitors !== null,
    customers: { total: totalCustomers, new: newCustomers, newSubscribers },
    conversionRate,
    payment,
    cancelRate: current.length ? Number(((cancelledCount / current.length) * 100).toFixed(1)) : 0,
    cancelledCount,
    returnsCount,
    engagement,
    reviews,
  });
});
