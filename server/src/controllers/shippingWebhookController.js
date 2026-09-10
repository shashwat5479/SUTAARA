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
// Expected body — adapt the field names / STATUS_MAP below to whatever your
// chosen courier actually sends:
//   { awbNumber: "AWB123", status: "delivered", note: "Delivered to recipient" }
const STATUS_MAP = {
  // courier term -> our OrderStatus enum value
  shipped: 'shipped',
  dispatched: 'shipped',
  in_transit: 'shipped',
  out_for_delivery: 'out_for_delivery',
  ofd: 'out_for_delivery',
  delivered: 'delivered',
  cancelled: 'cancelled',
  rto: 'cancelled',
  return_to_origin: 'cancelled',
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

  const { awbNumber, status, note } = req.body || {};
  if (!awbNumber || !status) {
    res.status(400);
    throw new Error('awbNumber and status are required');
  }

  const mapped = STATUS_MAP[String(status).toLowerCase()];
  if (!mapped) {
    // Unknown status term — acknowledge so the courier doesn't retry
    // forever, but don't guess at a mapping.
    return res.json({ ok: true, applied: false, reason: `Unrecognised status "${status}"` });
  }

  const order = await prisma.order.findFirst({ where: { awbNumber } });
  if (!order) {
    return res.json({ ok: true, applied: false, reason: 'No order found for that AWB number' });
  }

  await applyStatusChange(order.id, mapped, note || `Updated by delivery partner (AWB ${awbNumber})`);
  res.json({ ok: true, applied: true });
});
