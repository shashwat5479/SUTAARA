import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';

// GET /api/admin/analytics?days=30 — admin+. Revenue, order counts, status
// breakdown, and top-selling products over the given window. Cancelled
// orders are excluded from revenue/top-sellers (they were never fulfilled)
// but still counted in statusCounts so "X cancelled" stays visible.
export const getAnalytics = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [orders, statusGroups, topGrouped] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { totalPrice: true, status: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'name'],
      _sum: { qty: true },
      where: { order: { createdAt: { gte: since }, status: { not: 'cancelled' } } },
      orderBy: { _sum: { qty: 'desc' } },
      take: 10,
    }),
  ]);

  const counted = orders.filter((o) => o.status !== 'cancelled');
  const revenue = counted.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalOrders = orders.length;

  // Revenue bucketed by day, oldest first — enough for a simple bar chart
  // without pulling in a charting library.
  const byDay = new Map();
  for (const o of counted) {
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) || 0) + o.totalPrice);
  }
  const revenueByDay = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, total }));

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

  res.json({
    days,
    revenue,
    totalOrders,
    avgOrderValue: counted.length ? Math.round(revenue / counted.length) : 0,
    statusCounts: Object.fromEntries(statusGroups.map((s) => [s.status, s._count.status])),
    topProducts,
    revenueByDay,
  });
});
