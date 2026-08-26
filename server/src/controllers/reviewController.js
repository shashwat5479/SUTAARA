import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';

// Has this user actually bought this product in a real (non-cancelled) order?
// Reviews are only allowed for verified purchases.
async function hasPurchased(userId, productId) {
  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: { notIn: ['cancelled'] },
      },
    },
    select: { id: true },
  });
  return Boolean(item);
}

// GET /api/reviews/product/:productId — public: approved reviews for a product
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.productId, approved: true },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
  res.json(withMongoStyleId(reviews));
});

// GET /api/reviews/diaries — public: 5-star approved reviews, with product info,
// for the "Sutaara Diaries" section. Only the best make the diary.
export const getDiaries = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { rating: 5, approved: true },
    orderBy: { createdAt: 'desc' },
    take: 40,
    include: {
      user: { select: { name: true } },
      product: { select: { name: true, slug: true, images: true } },
    },
  });
  res.json(withMongoStyleId(reviews));
});

// GET /api/reviews/can-review/:productId — auth: can the logged-in user review this?
// Returns { canReview, alreadyReviewed }.
export const canReview = asyncHandler(async (req, res) => {
  const purchased = await hasPurchased(req.user.id, req.params.productId);
  const existing = await prisma.review.findFirst({
    where: { productId: req.params.productId, userId: req.user.id },
    select: { id: true },
  });
  res.json({ canReview: purchased && !existing, alreadyReviewed: Boolean(existing) });
});

// POST /api/reviews — auth: create a review (only if the user bought the product)
export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, body } = req.body;
  const stars = Number(rating);
  if (!productId || !stars || stars < 1 || stars > 5) {
    res.status(400);
    throw new Error('A product and a rating from 1 to 5 are required');
  }

  const purchased = await hasPurchased(req.user.id, productId);
  if (!purchased) {
    res.status(403);
    throw new Error('You can only review products you have purchased');
  }

  const existing = await prisma.review.findFirst({
    where: { productId, userId: req.user.id },
    select: { id: true },
  });
  if (existing) {
    res.status(409);
    throw new Error('You have already reviewed this product');
  }

  const review = await prisma.review.create({
    data: {
      productId,
      userId: req.user.id,
      rating: stars,
      title: (title || '').trim(),
      body: (body || '').trim(),
      verified: true, // always a verified purchase, per the rule above
      approved: true,
    },
  });

  // Keep the product's aggregate rating fresh.
  const agg = await prisma.review.aggregate({
    where: { productId, approved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: agg._avg.rating || stars,
      numReviews: agg._count.rating,
    },
  });

  res.status(201).json(withMongoStyleId(review));
});

// GET /api/reviews — admin: all reviews
export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true } },
    },
  });
  res.json(withMongoStyleId(reviews));
});

// PUT /api/reviews/:id/approve — admin: toggle approval (hide/show)
export const setApproval = asyncHandler(async (req, res) => {
  const review = await prisma.review.update({
    where: { id: req.params.id },
    data: { approved: Boolean(req.body.approved) },
  });
  res.json(withMongoStyleId(review));
});

// DELETE /api/reviews/:id — admin
export const deleteReview = asyncHandler(async (req, res) => {
  await prisma.review.delete({ where: { id: req.params.id } });
  res.json({ message: 'Review removed' });
});
