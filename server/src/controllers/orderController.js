import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';
import { createShipment } from '../services/shipping.js';
import { notifyCustomerStatus, notifyOwnerNewOrder } from '../services/notify.js';

const SHIPPING_FREE_ABOVE = 4999;
const SHIPPING_FLAT = 100;
const GST_RATE = Number(process.env.GST_RATE || 0); // e.g. 0.05 for 5% — leave 0 until GST-registered

const nextOrderNumber = async (tx) => {
  const count = await tx.order.count();
  return `SUT-${String(count + 1).padStart(6, '0')}`;
};

export const nextInvoiceNumber = async (tx) => {
  const count = await tx.order.count({ where: { invoiceNumber: { not: null } } });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
};

// Shared by the Razorpay "verify" endpoint and the webhook handler — both can
// fire for the same payment (the browser redirect and Razorpay's server-to-
// server webhook are independent signals), so this is written to be safe to
// call twice: if the order is already marked paid, it's returned unchanged.
export async function markOrderPaid(orderId, { razorpayPaymentId, razorpaySignature } = {}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.isPaid) return order; // idempotent

    const data = { isPaid: true, paidAt: new Date(), paymentStatus: 'paid' };
    if (razorpayPaymentId) data.razorpayPaymentId = razorpayPaymentId;
    if (razorpaySignature) data.razorpaySignature = razorpaySignature;

    // Auto-confirm the moment payment clears, and generate the invoice right
    // then — this is the "Mark Order = PAID -> Confirm Sutaara Order" step
    // from the flow: online orders don't wait for a human to click "confirm".
    if (order.status === 'pending') {
      data.status = 'confirmed';
      if (!order.invoiceNumber) {
        data.invoiceNumber = await nextInvoiceNumber(tx);
        data.invoicedAt = new Date();
      }
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        ...data,
        statusHistory: data.status
          ? { create: { status: data.status, note: 'Payment received via Razorpay — auto-confirmed' } }
          : undefined,
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  });
}

// A payment attempt failed (or the customer abandoned checkout). This never
// touches order.status — the order stays "pending" fulfilment so the
// customer can simply retry payment; only paymentStatus reflects the failure.
export async function markOrderPaymentFailed(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.isPaid) return order; // never downgrade a paid order
  return prisma.order.update({ where: { id: orderId }, data: { paymentStatus: 'failed' } });
}

// POST /api/orders (auth) — prices are recomputed server-side from the DB.
// Runs inside a transaction so stock checks, stock deduction, coupon usage
// and order creation either all succeed or all roll back — fixing the
// original version, which never touched stock at all and could oversell
// a product under concurrent orders.
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'cod', couponCode } = req.body;
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Your bag is empty');
  }
  const addr = shippingAddress || {};
  if (!addr.fullName || !addr.phone || !addr.line1 || !addr.city || !addr.state || !addr.pincode) {
    res.status(400);
    throw new Error('A complete shipping address is required');
  }

  const order = await prisma.$transaction(async (tx) => {
    const ids = [...new Set(items.map((i) => i.product))];
    const dbProducts = await tx.product.findMany({ where: { id: { in: ids } } });
    const map = new Map(dbProducts.map((p) => [p.id, p]));

    const orderItemsData = items.map((i) => {
      const p = map.get(i.product);
      if (!p) throw Object.assign(new Error('One of the items is no longer available'), { status: 400 });
      const qty = Math.max(1, Number(i.qty) || 1);
      if (p.stock < qty) {
        throw Object.assign(new Error(`Only ${p.stock} left in stock for "${p.name}"`), { status: 409 });
      }
      return {
        productId: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images[0] || '',
        price: p.price,
        qty,
      };
    });

    const itemsPrice = orderItemsData.reduce((sum, i) => sum + i.price * i.qty, 0);

    // Coupon (optional)
    let coupon = null;
    let discountPrice = 0;
    if (couponCode) {
      coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase().trim() } });
      if (!coupon || !coupon.active) throw Object.assign(new Error('Invalid coupon code'), { status: 400 });
      if (coupon.expiresAt && coupon.expiresAt < new Date())
        throw Object.assign(new Error('This coupon has expired'), { status: 400 });
      if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit)
        throw Object.assign(new Error('This coupon has reached its usage limit'), { status: 400 });
      if (itemsPrice < coupon.minOrderValue)
        throw Object.assign(
          new Error(`Add items worth Rs. ${coupon.minOrderValue - itemsPrice} more to use this coupon`),
          { status: 400 }
        );
      discountPrice =
        coupon.discountType === 'percent' ? Math.round((itemsPrice * coupon.value) / 100) : coupon.value;
      if (coupon.maxDiscount) discountPrice = Math.min(discountPrice, coupon.maxDiscount);
      discountPrice = Math.min(discountPrice, itemsPrice);
    }

    const taxableAmount = itemsPrice - discountPrice;
    const shippingPrice = taxableAmount >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_FLAT;
    const taxPrice = Math.round(taxableAmount * GST_RATE);
    const totalPrice = taxableAmount + shippingPrice + taxPrice;

    // Deduct stock now (not just at "shipped") so two customers can't both
    // check out the last unit of a size.
    for (const item of orderItemsData) {
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (updated.count === 0) {
        throw Object.assign(new Error(`"${item.name}" just went out of stock`), { status: 409 });
      }
    }

    const orderNumber = await nextOrderNumber(tx);

    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        fullName: addr.fullName,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2 || '',
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        paymentMethod,
        paymentStatus: paymentMethod === 'online' ? 'pending' : 'not_applicable',
        itemsPrice,
        shippingPrice,
        discountPrice,
        taxPrice,
        totalPrice,
        couponId: coupon?.id,
        status: 'pending',
        items: { create: orderItemsData },
        statusHistory: { create: { status: 'pending', note: 'Order placed by customer' } },
      },
      include: { items: true, statusHistory: true, user: { select: { id: true, name: true, email: true } } },
    });

    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { timesUsed: { increment: 1 } } });
    }

    return created;
  });

  // Fire notifications after the order is committed. Wrapped so a failure here
  // never affects the order response the customer sees.
  try {
    await notifyOwnerNewOrder(order);
    await notifyCustomerStatus(order, 'pending');
  } catch (err) {
    console.error('[order] notification error:', err.message);
  }

  res.status(201).json(withMongoStyleId(order));
});

// GET /api/orders/mine (auth)
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: true, paymentAttempts: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(withMongoStyleId(orders));
});

// GET /api/orders/:id (auth — own order or admin)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
      paymentAttempts: { orderBy: { createdAt: 'desc' } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const owns = order.userId === req.user.id;
  if (!owns && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not your order');
  }
  res.json(withMongoStyleId(order));
});

// GET /api/orders (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    include: {
      items: true,
      user: { select: { id: true, name: true, email: true } },
      paymentAttempts: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(withMongoStyleId(orders));
});

const VALID_STATUSES = [
  'pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery',
  'delivered', 'cancelled', 'return_requested', 'return_approved', 'refund_initiated', 'refunded',
];

// Shared by the admin/staff status route, the customer's "request return"
// action, and the delivery-partner webhook — one place that knows how to
// move an order to a new status, run the side effects (invoice generation,
// shipment creation, restock), and notify the customer. Whoever calls this
// (a human clicking a dropdown, or a courier's server), the customer sees
// the same automated email.
export async function applyStatusChange(orderId, status, note = '') {
  if (!VALID_STATUSES.includes(status)) {
    throw Object.assign(new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`), { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });

  const data = { status };

  if (status === 'confirmed' && !order.invoiceNumber) {
    data.invoiceNumber = await nextInvoiceNumber(prisma);
    data.invoicedAt = new Date();
  }

  if (status === 'shipped' && !order.awbNumber) {
    const shipment = await createShipment(order);
    data.awbNumber = shipment.awbNumber;
    data.courierName = shipment.courierName;
    data.trackingUrl = shipment.trackingUrl;
    data.estDelivery = shipment.estDelivery;
    data.shippedAt = new Date();
  }

  if (status === 'delivered' && order.paymentMethod === 'cod') {
    data.isPaid = true;
    data.paidAt = new Date();
  }

  // Restock automatically on cancellation or an approved return.
  const restockStatuses = ['cancelled', 'return_approved'];
  const alreadyRestocked = ['cancelled', 'return_approved', 'refund_initiated', 'refunded'].includes(order.status);
  if (restockStatuses.includes(status) && !alreadyRestocked) {
    await prisma.$transaction(
      order.items.map((item) =>
        prisma.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } })
      )
    );
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { ...data, statusHistory: { create: { status, note: note || '' } } },
    include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } }, user: { select: { id: true, name: true, email: true } } },
  });

  try {
    await notifyCustomerStatus(updated, status);
  } catch (err) {
    console.error('[order] status notification error:', err.message);
  }

  return updated;
}

// PUT /api/orders/:id/status (admin/staff)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const updated = await applyStatusChange(req.params.id, status, note);
  res.json(withMongoStyleId(updated));
});

// PATCH /api/orders/:id/return-eligibility (admin/staff)
// Toggles whether the customer sees a "Request return/refund" button for
// this order at all — not every piece is meant to be returnable (altered
// blouses, festive/wedding pieces sold as final sale), so this is an
// explicit per-order decision, not automatic.
export const setReturnEligibility = asyncHandler(async (req, res) => {
  const { eligible } = req.body;
  if (typeof eligible !== 'boolean') {
    res.status(400);
    throw new Error('eligible must be true or false');
  }
  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { returnEligible: eligible },
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
  });
  res.json(withMongoStyleId(updated));
});

// POST /api/orders/:id/request-return (customer, owns the order)
// The customer-facing half of the return/refund flow — only works if an
// admin has already flipped returnEligible on, and only once the order has
// actually been delivered.
export const requestReturn = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not your order');
  }
  if (!order.returnEligible) {
    res.status(400);
    throw new Error('This order is not eligible for return/refund');
  }
  if (order.status !== 'delivered') {
    res.status(400);
    throw new Error('Only delivered orders can be returned');
  }

  const updated = await applyStatusChange(
    order.id,
    'return_requested',
    reason ? `Customer request: ${reason}` : 'Requested by customer'
  );
  res.json(withMongoStyleId(updated));
});
