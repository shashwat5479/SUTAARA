import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  isRazorpayConfigured,
  razorpayKeyId,
} from '../services/razorpay.js';
import { markOrderPaid, markOrderPaymentFailed } from './orderController.js';
import { notifyCustomerStatus, notifyOwnerNewOrder, notifyOwnerPaymentFailed, sendInvoiceEmail } from '../services/notify.js';

async function loadOwnedOrder(req) {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId || req.body.orderId } });
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
  const owns = order.userId === req.user.id;
  if (!owns && req.user.role !== 'admin' && req.user.role !== 'staff' && req.user.role !== 'superadmin') {
    throw Object.assign(new Error('Not your order'), { status: 403 });
  }
  return order;
}

// GET /api/payments/razorpay/key — public: the key ID is safe to expose
// (it's the public half of the pair; only the secret is sensitive).
export const getRazorpayKey = asyncHandler(async (req, res) => {
  res.json({ keyId: isRazorpayConfigured() ? razorpayKeyId() : null });
});

// POST /api/payments/razorpay/orders/:orderId (auth, owner or staff+)
// Creates a Razorpay Order for an existing Sutaara order and logs a new
// PaymentAttempt row. Safe to call again for the same order (e.g. retrying
// after a failure) — each call is its own attempt.
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const order = await loadOwnedOrder(req);

  if (order.isPaid) {
    res.status(409);
    throw new Error('This order is already paid');
  }
  if (order.paymentMethod !== 'online') {
    res.status(400);
    throw new Error('This order is not set up for online payment');
  }

  const rpOrder = await createRazorpayOrder({
    amountPaise: order.totalPrice * 100,
    receipt: order.orderNumber,
    notes: { sutaaraOrderId: order.id, orderNumber: order.orderNumber },
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rpOrder.id, paymentStatus: 'pending' },
    }),
    prisma.paymentAttempt.create({
      data: {
        orderId: order.id,
        razorpayOrderId: rpOrder.id,
        status: 'created',
        amount: order.totalPrice * 100,
      },
    }),
  ]);

  res.json({
    keyId: razorpayKeyId(),
    razorpayOrderId: rpOrder.id,
    amount: rpOrder.amount,
    currency: rpOrder.currency,
    orderNumber: order.orderNumber,
    name: order.fullName,
    phone: order.phone,
  });
});

// POST /api/payments/razorpay/verify (auth)
// Called by the browser immediately after Razorpay Checkout's `handler`
// fires with a successful payment. This is the client-driven confirmation
// path; the webhook below is the server-to-server backstop for the same
// event, so either one landing first is enough to mark the order paid.
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing payment verification fields');
  }

  const order = await loadOwnedOrder(req);
  if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
    res.status(400);
    throw new Error('Payment does not match this order');
  }

  const valid = verifyPaymentSignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  if (!valid) {
    await prisma.paymentAttempt.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: { status: 'failed', razorpayPaymentId: razorpay_payment_id, errorDescription: 'Signature verification failed' },
    });
    await markOrderPaymentFailed(order.id);
    res.status(400);
    throw new Error('Payment verification failed — please try again');
  }

  await prisma.paymentAttempt.updateMany({
    where: { razorpayOrderId: razorpay_order_id },
    data: { status: 'captured', razorpayPaymentId: razorpay_payment_id },
  });

  const updated = await markOrderPaid(order.id, {
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  // Fire notifications after commit — never let a slow/failed email undo the
  // payment result the customer is looking at.
  try {
    await notifyOwnerNewOrder(updated);
    await notifyCustomerStatus(updated, 'confirmed');
    if (updated.invoiceNumber) await sendInvoiceEmail(updated);
  } catch (err) {
    console.error('[payments] post-payment notification error:', err.message);
  }

  res.json(withMongoStyleId(updated));
});

// POST /api/payments/razorpay/failure (auth)
// Called when Razorpay Checkout reports a failed payment or the modal is
// dismissed without completing — lets the admin panel show *which* attempt
// failed and why, instead of the order just silently staying "pending"
// forever with no explanation.
export const recordPaymentFailure = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, code, description } = req.body;
  const order = await loadOwnedOrder(req);

  if (razorpay_order_id) {
    await prisma.paymentAttempt.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: { status: 'failed', errorCode: code || null, errorDescription: description || 'Payment was not completed' },
    });
  }
  const updated = await markOrderPaymentFailed(order.id);

  try {
    await notifyOwnerPaymentFailed(updated, description);
  } catch (err) {
    console.error('[payments] failure notification error:', err.message);
  }

  res.json({ ok: true });
});

// POST /api/payments/razorpay/webhook — NOT behind `protect`; authenticity is
// established purely by the signature header, verified against the raw
// request body (see app.js for why this route gets express.raw() instead of
// express.json()). This is the "Webhook Monitoring" step in the flow: even
// if the customer closes the tab right after paying, before the browser
// calls /verify, this still lands and marks the order paid.
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer, thanks to express.raw()

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(400);
    throw new Error('Invalid webhook signature');
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  const payload = event.payload?.payment?.entity || event.payload?.order?.entity;
  const razorpayOrderId = payload?.order_id || payload?.id;

  if (!razorpayOrderId) {
    return res.json({ ok: true }); // nothing actionable, ack anyway so Razorpay stops retrying
  }

  const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
  if (!order) {
    return res.json({ ok: true }); // order created via a different flow / test event — ignore quietly
  }

  if (event.event === 'payment.captured') {
    const paymentEntity = event.payload.payment.entity;
    await prisma.paymentAttempt.updateMany({
      where: { razorpayOrderId },
      data: { status: 'captured', razorpayPaymentId: paymentEntity.id, method: paymentEntity.method || null },
    });
    const updated = await markOrderPaid(order.id, { razorpayPaymentId: paymentEntity.id });
    try {
      await notifyOwnerNewOrder(updated);
      await notifyCustomerStatus(updated, 'confirmed');
      if (updated.invoiceNumber) await sendInvoiceEmail(updated);
    } catch (err) {
      console.error('[payments] webhook notification error:', err.message);
    }
  } else if (event.event === 'payment.failed') {
    const paymentEntity = event.payload.payment.entity;
    await prisma.paymentAttempt.updateMany({
      where: { razorpayOrderId },
      data: {
        status: 'failed',
        razorpayPaymentId: paymentEntity.id,
        errorCode: paymentEntity.error_code || null,
        errorDescription: paymentEntity.error_description || null,
      },
    });
    const updated = await markOrderPaymentFailed(order.id);
    try {
      await notifyOwnerPaymentFailed(updated, paymentEntity.error_description);
    } catch (err) {
      console.error('[payments] webhook notification error:', err.message);
    }
  }

  res.json({ ok: true });
});
