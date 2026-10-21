import { prisma } from '../config/db.js';

// India-time calendar day (YYYY-MM-DD) — the store's "today".
const IST_OFFSET_MS = 330 * 60 * 1000;
export const istDay = (d = new Date()) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const VISITOR_ID = /^[a-zA-Z0-9-]{16,64}$/;
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|monitor|uptime/i;
const EVENT_TYPES = new Set(['view', 'wishlist_add', 'wishlist_remove', 'cart_add']);

// Tracking must never break the storefront — every failure (including the
// tables not existing yet, before the migration is applied) is swallowed and
// the request still answers 204.

// POST /api/track/visit  { visitorId } — public
export const trackVisit = async (req, res) => {
  try {
    const { visitorId } = req.body || {};
    if (VISITOR_ID.test(visitorId || '') && !BOT.test(req.get('user-agent') || '')) {
      const day = istDay();
      await prisma.siteVisit.upsert({
        where: { day_visitorId: { day, visitorId } },
        create: { day, visitorId },
        update: { views: { increment: 1 } },
      });
    }
  } catch {
    /* ignore */
  }
  res.status(204).end();
};

// POST /api/track/event  { productId, type, visitorId } — public
export const trackEvent = async (req, res) => {
  try {
    const { productId, type, visitorId } = req.body || {};
    if (
      EVENT_TYPES.has(type) &&
      typeof productId === 'string' && productId.length > 0 && productId.length <= 64 &&
      VISITOR_ID.test(visitorId || '') &&
      !BOT.test(req.get('user-agent') || '')
    ) {
      await prisma.productEvent.create({ data: { productId, type, visitorId } });
    }
  } catch {
    /* ignore */
  }
  res.status(204).end();
};
