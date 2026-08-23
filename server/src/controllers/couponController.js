import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';

// POST /api/coupons/validate (auth) — body: { code, itemsPrice }
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, itemsPrice = 0 } = req.body;
  const coupon = await prisma.coupon.findUnique({ where: { code: (code || '').toUpperCase().trim() } });
  if (!coupon || !coupon.active) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    res.status(400);
    throw new Error('This coupon has expired');
  }
  if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
    res.status(400);
    throw new Error('This coupon has reached its usage limit');
  }
  if (itemsPrice < coupon.minOrderValue) {
    res.status(400);
    throw new Error(`Add items worth Rs. ${coupon.minOrderValue - itemsPrice} more to use this coupon`);
  }
  let discount = coupon.discountType === 'percent' ? Math.round((itemsPrice * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, itemsPrice);
  res.json({ valid: true, discount, coupon: withMongoStyleId(coupon) });
});

// GET /api/coupons (admin)
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(withMongoStyleId(coupons));
});

// POST /api/coupons (admin)
export const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, value, minOrderValue, maxDiscount, usageLimit, expiresAt } = req.body;
  if (!code || !discountType || !value) {
    res.status(400);
    throw new Error('Code, discount type and value are required');
  }
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase().trim(),
      discountType,
      value: Number(value),
      minOrderValue: Number(minOrderValue || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  res.status(201).json(withMongoStyleId(coupon));
});

// PUT /api/coupons/:id (admin)
export const updateCoupon = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  delete body.id;
  delete body._id;
  delete body.code; // code is immutable once created to avoid breaking past orders' references
  if (body.value !== undefined) body.value = Number(body.value);
  if (body.minOrderValue !== undefined) body.minOrderValue = Number(body.minOrderValue);
  if (body.maxDiscount !== undefined) body.maxDiscount = body.maxDiscount ? Number(body.maxDiscount) : null;
  if (body.usageLimit !== undefined) body.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
  if (body.expiresAt !== undefined) body.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: body });
  res.json(withMongoStyleId(coupon));
});

// DELETE /api/coupons/:id (admin)
export const deleteCoupon = asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ message: 'Coupon removed' });
});
