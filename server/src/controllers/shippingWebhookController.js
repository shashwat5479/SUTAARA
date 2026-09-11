import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { applyStatusChange } from './orderController.js';

// Generic inbound webhook a courier/delivery-partner's system can call to
// update an order's status automatically — this is the "delivery partner"
// half of "updated by admin in the admin panel, or by the delivery
// partner": the same applyStatusChange() function runs either way, so the
// customer gets the same automated email regardless of who (or what)
// triggered the update.
//
// Auth: a shared secret in the X-Webhook-Secret header (set
// SHIPPING_WEBHOOK_SECRET in .env, and give the courier the same value —
// most courier platforms let you add a custom header to their webhook
// config). This is deliberately simple rather than provider-specific HMAC,
// since couriers vary widely in what they support; swap in the courier's
// own signature scheme here once you've picked a provider.
//
// Expected body — this accepts TWO shapes:
//
// 1. Shiprocket's real webhook shape (Settings > API > Configure Webhook in
//    your Shiprocket dashboard — set the URL to this endpoint and the
//    "Custom Header" to X-Webhook-Secret: <SHIPPING_WEBHOOK_SECRET>):
//      { "awb": "AWB123", "current_status": "Delivered", ... }
//
// 2. A generic shape, for any other courier you might use instead/as well:
//      { "awbNumber": "AWB123", "status": "delivered", "note": "..." }
const STATUS_MAP = {
  // Shiprocket's actual `current_status` strings (case-insensitive)
  'pickup scheduled': 'confirmed',
  'picked up': 'shipped',
  'in transit': 'shipped',
  'shipped': 'shipped',
  'dispatched': 'shipped',
  'out for delivery': 'out_for_delivery',
  'out_for_delivery': 'out_for_delivery',
  'delivered': 'delivered',
  'cancelled': 'cancelled',
  'canceled': 'cancelled',
  'rto initiated': 'cancelled',
  'rto delivered': 'cancelled',
  'return to origin': 'cancelled',
  'lost': 'cancelled',
};

export const handleShippingWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.SHIPPING_WEBHOOK_SECRET;
  if (!secret) {
    res.status(503);
    throw new Error('Delivery-partner webhook is not configured — set SHIPPING_WEBHOOK_SECRET');
  }
  if (req.headers['x-webhook-secret'] !== secret) {
    res.status(401);
    throw new Error('Invalid webhook secret');
  }

  const body = req.body || {};
  // Accept either Shiprocket's field names or the generic ones
  const awbNumber = body.awb || body.awbNumber;
  const rawStatus = body.current_status || body.status;
  const note = body.note || (body.current_status ? `Shiprocket: ${body.current_status}` : undefined);

  if (!awbNumber || !rawStatus) {
    res.status(400);
    throw new Error('awb/awbNumber and current_status/status are required');
  }

  const mapped = STATUS_MAP[String(rawStatus).toLowerCase()];
  if (!mapped) {
    // Unknown status term — acknowledge so the courier doesn't retry
    // forever, but don't guess at a mapping. Add it to STATUS_MAP above
    // once you see what term they're actually sending.
    return res.json({ ok: true, applied: false, reason: `Unrecognised status "${rawStatus}"` });
  }

  const order = await prisma.order.findFirst({ where: { awbNumber } });
  if (!order) {
    return res.json({ ok: true, applied: false, reason: 'No order found for that AWB number' });
  }

  await applyStatusChange(order.id, mapped, note || `Updated by delivery partner (AWB ${awbNumber})`);
  res.json({ ok: true, applied: true });
});
