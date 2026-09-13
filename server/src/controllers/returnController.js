import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';
import { applyStatusChange } from './orderController.js';
import Razorpay from 'razorpay';

const STAFF_ROLES = ['staff', 'admin', 'superadmin'];

function rp() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });
}

// POST /api/returns/:orderId — customer submits a return request with photos
// Photos are uploaded as base64 strings from the browser; we store the URLs
// directly (customer uploads to a CDN separately, or passes the URL they got
// from a presigned upload). The frontend's file-upload flow gets a presigned
// URL from /api/returns/upload-url, uploads the file directly, then passes
// the resulting URL here — no files ever touch our server.
export const submitReturnRequest = asyncHandler(async (req, res) => {
  const { reason, category, photos = [], description } = req.body;
  if (!reason) { res.status(400); throw new Error('reason is required'); }

  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: { returnRequest: true },
  });
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.userId !== req.user.id) { res.status(403); throw new Error('Not your order'); }
  if (!order.returnEligible) { res.status(400); throw new Error('This order is not eligible for return/refund'); }
  if (order.status !== 'delivered') { res.status(400); throw new Error('Only delivered orders can be returned'); }
  if (order.returnRequest) { res.status(409); throw new Error('A return request already exists for this order'); }

  const rr = await prisma.returnRequest.create({
    data: { orderId: order.id, reason, category: category || 'other', photos, description },
  });

  // Move order to return_requested
  await applyStatusChange(order.id, 'return_requested', `Customer filed return: ${reason}`);

  res.status(201).json(withMongoStyleId(rr));
});

// GET /api/returns/:orderId — customer or staff views a return request
export const getReturnRequest = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) { res.status(404); throw new Error('Order not found'); }
  const isStaff = STAFF_ROLES.includes(req.user.role);
  if (!isStaff && order.userId !== req.user.id) { res.status(403); throw new Error('Not your order'); }

  const rr = await prisma.returnRequest.findUnique({ where: { orderId: order.id } });
  if (!rr) { res.status(404); throw new Error('No return request found for this order'); }
  res.json(withMongoStyleId(rr));
});

// GET /api/returns — admin: list all return requests, newest first
export const listReturnRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const requests = await prisma.returnRequest.findMany({
    where: status ? { status } : undefined,
    include: { order: { include: { user: { select: { id: true, name: true, email: true } }, items: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(withMongoStyleId(requests));
});

// PATCH /api/returns/:orderId/review — admin marks as under_review
export const markUnderReview = asyncHandler(async (req, res) => {
  const rr = await prisma.returnRequest.update({
    where: { orderId: req.params.orderId },
    data: { status: 'under_review' },
  });
  res.json(withMongoStyleId(rr));
});

// POST /api/returns/:orderId/approve — admin approves the return
// For online-paid orders, triggers the Razorpay refund automatically.
export const approveReturn = asyncHandler(async (req, res) => {
  const { adminNote, refundAmount } = req.body;

  const rr = await prisma.returnRequest.findUnique({ where: { orderId: req.params.orderId } });
  if (!rr) { res.status(404); throw new Error('No return request found'); }

  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  let refundData = {};

  // Auto-initiate refund for online-paid orders
  if (order.isPaid && order.razorpayPaymentId) {
    const amountPaise = refundAmount ? refundAmount * 100 : order.totalPrice * 100;
    try {
      const refund = await rp().payments.refund(order.razorpayPaymentId, {
        amount: amountPaise,
        notes: { orderId: order.id, orderNumber: order.orderNumber, reason: rr.reason },
      });
      refundData = {
        refundId: refund.id,
        refundStatus: refund.status,
        refundAmount: amountPaise,
        refundInitiatedAt: new Date(),
      };
    } catch (err) {
      console.error('[return] Razorpay refund error:', err.message);
      // Don't block approval if refund fails — admin can retry manually
    }
  }

  const updated = await prisma.returnRequest.update({
    where: { orderId: req.params.orderId },
    data: {
      status: refundData.refundId ? 'refund_initiated' : 'approved',
      adminNote: adminNote || null,
      ...refundData,
    },
  });

  await applyStatusChange(order.id, refundData.refundId ? 'refund_initiated' : 'return_approved',
    adminNote || 'Return approved by admin');

  res.json(withMongoStyleId(updated));
});

// POST /api/returns/:orderId/reject — admin rejects the return
export const rejectReturn = asyncHandler(async (req, res) => {
  const { adminNote, rejectedReason } = req.body;
  if (!rejectedReason) { res.status(400); throw new Error('rejectedReason is required'); }

  const rr = await prisma.returnRequest.update({
    where: { orderId: req.params.orderId },
    data: { status: 'rejected', adminNote: adminNote || null, rejectedReason },
  });

  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  await applyStatusChange(order.id, 'confirmed', `Return rejected: ${rejectedReason}`);

  res.json(withMongoStyleId(rr));
});

// POST /api/returns/:orderId/refund — admin manually initiates/retries a refund
// Used when the auto-refund on approval failed or for COD orders
// (where refund goes to a UPI/bank provided manually).
export const initiateRefund = asyncHandler(async (req, res) => {
  const { refundAmount } = req.body;

  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const rr = await prisma.returnRequest.findUnique({ where: { orderId: order.id } });
  if (!rr) { res.status(404); throw new Error('No return request found'); }

  if (!order.razorpayPaymentId) {
    res.status(400);
    throw new Error('No Razorpay payment on file — for COD orders, process the refund manually via bank transfer/UPI and then mark it settled');
  }

  const amountPaise = refundAmount ? refundAmount * 100 : order.totalPrice * 100;
  const refund = await rp().payments.refund(order.razorpayPaymentId, {
    amount: amountPaise,
    notes: { orderId: order.id, orderNumber: order.orderNumber, reason: rr.reason },
  });

  const updated = await prisma.returnRequest.update({
    where: { orderId: order.id },
    data: {
      status: 'refund_initiated',
      refundId: refund.id,
      refundStatus: refund.status,
      refundAmount: amountPaise,
      refundInitiatedAt: new Date(),
    },
  });

  await applyStatusChange(order.id, 'refund_initiated', `Razorpay refund ${refund.id} initiated`);

  res.json(withMongoStyleId(updated));
});

// POST /api/returns/:orderId/mark-settled — admin marks a COD refund as
// settled after doing it manually (UPI/bank transfer outside Razorpay)
export const markRefundSettled = asyncHandler(async (req, res) => {
  const { adminNote } = req.body;

  const updated = await prisma.returnRequest.update({
    where: { orderId: req.params.orderId },
    data: { status: 'refund_settled', refundSettledAt: new Date(), adminNote: adminNote || null },
  });

  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  await applyStatusChange(order.id, 'refunded', adminNote || 'Refund confirmed as settled');

  res.json(withMongoStyleId(updated));
});

// Razorpay's refund.updated webhook — marks the request as settled automatically
// when Razorpay confirms the money reached the customer's account.
// Wire this in app.js alongside the existing payment webhook handlers.
export const handleRefundWebhook = asyncHandler(async (req, res) => {
  const event = JSON.parse(req.body.toString('utf8'));
  if (event.event !== 'refund.processed') return res.json({ ok: true });

  const refundId = event.payload?.refund?.entity?.id;
  if (!refundId) return res.json({ ok: true });

  const rr = await prisma.returnRequest.findFirst({ where: { refundId } });
  if (!rr) return res.json({ ok: true });

  await prisma.returnRequest.update({
    where: { id: rr.id },
    data: { status: 'refund_settled', refundSettledAt: new Date(), refundStatus: 'processed' },
  });
  await applyStatusChange(rr.orderId, 'refunded', `Razorpay confirmed refund ${refundId} settled`);

  res.json({ ok: true });
});

// GET /api/returns/upload-url — get a presigned URL for photo upload
// Uses Cloudinary if configured, otherwise returns a placeholder.
// The browser uploads directly to Cloudinary (no file touches our server).
export const getUploadUrl = asyncHandler(async (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    // Not configured — return a simple base64 data URL approach as fallback
    res.json({ method: 'base64', message: 'Upload photos as base64 strings' });
    return;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'sutaara-returns';
  const crypto = await import('crypto');
  const signature = crypto.default
    .createHash('sha256')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  res.json({
    method: 'cloudinary',
    url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    apiKey,
    timestamp,
    signature,
    folder,
  });
});
