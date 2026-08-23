import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Guarantees a unique slug even if two products share a name
// (bug in the original: createProduct/updateProduct could throw a raw
// duplicate-key error instead of a friendly one, or silently collide).
async function uniqueSlug(base, ignoreId) {
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

// GET /api/products — supports filters, sort, search, pagination
export const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    fabric,
    occasion,
    color,
    minPrice,
    maxPrice,
    search,
    sort = 'featured',
    page = 1,
    limit = 24,
    featured,
    newArrival,
  } = req.query;

  const where = {};
  if (category) where.category = category;
  if (fabric) where.fabric = { equals: fabric, mode: 'insensitive' };
  if (occasion) where.occasion = { equals: occasion, mode: 'insensitive' };
  if (color) where.color = { equals: color, mode: 'insensitive' };
  if (featured === 'true') where.featured = true;
  if (newArrival === 'true') where.isNewArrival = true;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  if (search) {
    where.OR = ['name', 'description', 'fabric', 'occasion'].map((field) => ({
      [field]: { contains: search, mode: 'insensitive' },
    }));
  }

  const sortMap = {
    featured: [{ featured: 'desc' }, { createdAt: 'desc' }],
    newest: [{ createdAt: 'desc' }],
    priceLow: [{ price: 'asc' }],
    priceHigh: [{ price: 'desc' }],
    rating: [{ rating: 'desc' }],
  };

  const pageNum = Math.max(1, Number(page) || 1);
  const perPage = Math.min(60, Number(limit) || 24);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: sortMap[sort] || sortMap.featured,
      skip: (pageNum - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: withMongoStyleId(items),
    page: pageNum,
    pages: Math.ceil(total / perPage) || 1,
    total,
  });
});

// GET /api/products/facets — distinct values for building filter UI
export const getFacets = asyncHandler(async (req, res) => {
  const [fabrics, occasions, colors, agg] = await Promise.all([
    prisma.product.findMany({ select: { fabric: true }, distinct: ['fabric'] }),
    prisma.product.findMany({ select: { occasion: true }, distinct: ['occasion'] }),
    prisma.product.findMany({ select: { color: true }, distinct: ['color'] }),
    prisma.product.aggregate({ _min: { price: true }, _max: { price: true } }),
  ]);
  res.json({
    fabrics: fabrics.map((f) => f.fabric).filter(Boolean).sort(),
    occasions: occasions.map((o) => o.occasion).filter(Boolean).sort(),
    colors: colors.map((c) => c.color).filter(Boolean).sort(),
    priceRange: { min: agg._min.price || 0, max: agg._max.price || 0 },
  });
});

// GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const related = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id } },
    take: 4,
  });
  res.json({ product: withMongoStyleId(product), related: withMongoStyleId(related) });
});

// POST /api/products (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (!body.name || body.price === undefined || !body.category) {
    res.status(400);
    throw new Error('Name, category and price are required');
  }
  body.slug = await uniqueSlug(body.slug ? slugify(body.slug) : slugify(body.name));
  body.price = Number(body.price);
  body.mrp = Number(body.mrp || 0);
  body.stock = Number(body.stock ?? 10);
  if (!Array.isArray(body.images)) body.images = body.images ? [body.images] : [];
  const product = await prisma.product.create({ data: body });
  res.status(201).json(withMongoStyleId(product));
});

// PUT /api/products/:id (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Product not found');
  }
  const body = { ...req.body };
  delete body.id;
  delete body._id;
  if (body.name && !req.body.slug) body.slug = await uniqueSlug(slugify(body.name), existing.id);
  if (body.price !== undefined) body.price = Number(body.price);
  if (body.mrp !== undefined) body.mrp = Number(body.mrp);
  if (body.stock !== undefined) body.stock = Number(body.stock);
  const product = await prisma.product.update({ where: { id: req.params.id }, data: body });
  res.json(withMongoStyleId(product));
});

// DELETE /api/products/:id (admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404);
    throw new Error('Product not found');
  }
  // Bug fix: the Mongo version hard-deleted products even if they were
  // referenced by past orders, which would corrupt order history via the
  // ref. Postgres now enforces this via FK — block deletion if orders exist,
  // and tell the admin why instead of throwing a raw 500.
  const orderCount = await prisma.orderItem.count({ where: { productId: req.params.id } });
  if (orderCount > 0) {
    res.status(409);
    throw new Error('This product has past orders — unpublish it instead of deleting');
  }
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Product removed' });
});
