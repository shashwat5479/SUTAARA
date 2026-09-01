import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';
import { createShipment } from '../services/shipping.js';
import { notifyCustomerStatus, notifyOwnerNewOrder } from '../services/notify.js';

const SHIPPING_FREE_ABOVE = 2999;
const SHIPPING_FLAT = 99;
const GST_RATE = Number(process.env.GST_RATE || 0); // e.g. 0.05 for 5% — leave 0 until GST-registered

const nextOrderNumber = async (tx) => {
  const count = await tx.order.count();
  return `SUT-${String(count + 1).padStart(6, '0')}`;
};

const nextInvoiceNumber = async (tx) => {
  const count = await tx.order.count({ where: { invoiceNumber: { not: null } } });
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
};

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
      include: { items: true, statusHistory: true },
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
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(withMongoStyleId(orders));
});

// GET /api/orders/:id (auth — own order or admin)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } }, user: { select: { id: true, name: true, email: true } } },
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
    include: { items: true, user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(withMongoStyleId(orders));
});

const VALID_STATUSES = [
  'pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery',
  'delivered', 'cancelled', 'return_requested', 'return_approved', 'refund_initiated', 'refunded',
];

// PUT /api/orders/:id/status (admin)
// Drives the automation described in the brief: confirming an order generates
// its invoice number; marking it "shipped" (without an existing AWB) calls the
// shipping provider to create a shipment; cancelling/returning restores stock.
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!status || !VALID_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

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

  // Restock automatically on cancellation or an approved return —
  // the original app had no path for this at all.
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
    include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
  });

  // Notify the customer of the new status (fails soft).
  try {
    await notifyCustomerStatus(updated, status);
  } catch (err) {
    console.error('[order] status notification error:', err.message);
  }

  res.json(withMongoStyleId(updated));
});
