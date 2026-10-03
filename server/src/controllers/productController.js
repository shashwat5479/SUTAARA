import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';
import { buildFacet, colorsOf, fabricsOf, occasionsOf, rawValuesInFamily, resolveFamily } from '../utils/taxonomy.js';

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

// Distinct raw values of a text column (fabric / occasion / colour) with the
// number of products using each. `where` scopes it (e.g. to one category).
async function distinctWithCounts(field, where = {}) {
  const groups = await prisma.product.groupBy({
    by: [field],
    where,
    _count: { _all: true },
  });
  return groups.map((g) => ({ value: g[field], count: g._count._all }));
}

// Turns what the shopper picked in the sidebar into a Prisma filter.
// A picked family ("Silk", "Work", "Rani Pink") matches every product whose
// stored text belongs to that family. Anything that isn't a family (an old
// bookmarked link such as fabric=Ajrakh Cotton) still works as an exact,
// case-insensitive match, exactly as before.
async function familyFilter(field, param) {
  const family = resolveFamily(field, param);
  if (!family) return { equals: param, mode: 'insensitive' };
  const rows = await distinctWithCounts(field);
  return { in: rawValuesInFamily(field, family, rows) };
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
  if (fabric) where.fabric = await familyFilter('fabric', String(fabric));
  if (occasion) where.occasion = await familyFilter('occasion', String(occasion));
  if (color) where.color = await familyFilter('color', String(color));
  if (featured === 'true') where.featured = true;
  if (newArrival === 'true') where.isNewArrival = true;
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }
  if (search) {
    where.OR = ['name', 'description', 'fabric', 'occasion', 'color'].map((field) => ({
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

// GET /api/products/facets — the sidebar filter options.
// Accepts an optional ?category= so the sidebar only shows what exists in that
// category.
//
// Fabric / occasion / colour are free text on each product, so listing the
// raw values produced one sidebar row per distinct string (500 products could
// mean 500 rows, and occasions were whole sentences). They are now grouped
// into a short fixed set of families (see utils/taxonomy.js) with a product
// count and, for colours, the real swatch colour.
//
// `fabrics` / `occasions` / `colors` stay plain arrays of family names for
// backwards compatibility; the richer `*Options` arrays are what the shop
// page uses.
export const getFacets = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const where = category ? { category: String(category) } : {};
  const [fabricRows, occasionRows, colorRows, agg] = await Promise.all([
    distinctWithCounts('fabric', where),
    distinctWithCounts('occasion', where),
    distinctWithCounts('color', where),
    prisma.product.aggregate({ where, _min: { price: true }, _max: { price: true } }),
  ]);
  const fabricOptions = buildFacet('fabric', fabricRows);
  const occasionOptions = buildFacet('occasion', occasionRows);
  const colorOptions = buildFacet('color', colorRows);
  res.json({
    fabrics: fabricOptions.map((o) => o.value),
    occasions: occasionOptions.map((o) => o.value),
    colors: colorOptions.map((o) => o.value),
    fabricOptions,
    occasionOptions,
    colorOptions,
    priceRange: { min: agg._min.price || 0, max: agg._max.price || 0 },
  });
});

// How many "similar / you may also like" products a product page gets.
const RELATED_LIMIT = 16;

// Ranks other products by how well they go with `product`: same fabric
// family, colour family and occasion matter most, then a similar price, then
// new arrivals / featured pieces. Same-category pieces always come first
// (a saree page shows sarees); if the category is small, the row is topped up
// from the rest of the catalogue so it's never nearly empty.
async function findRelated(product) {
  const overlap = (a, b) => a.some((x) => b.includes(x));
  const fab = fabricsOf(product.fabric);
  const col = colorsOf(product.color);
  const occ = occasionsOf(product.occasion);

  const score = (p) => {
    let s = 0;
    if (fab.length && overlap(fab, fabricsOf(p.fabric))) s += 3;
    if (col.length && overlap(col, colorsOf(p.color))) s += 2;
    if (occ.length && overlap(occ, occasionsOf(p.occasion))) s += 2;
    if (product.price > 0 && Math.abs(p.price - product.price) <= product.price * 0.4) s += 1;
    if (p.isNewArrival) s += 0.5;
    if (p.featured) s += 0.5;
    return s;
  };
  const rank = (list) =>
    list
      .map((p) => ({ p, s: score(p) }))
      .sort((a, b) => b.s - a.s || new Date(b.p.createdAt) - new Date(a.p.createdAt))
      .map((x) => x.p);

  // Cap the candidate pool so a very large catalogue stays fast.
  const same = await prisma.product.findMany({
    where: { category: product.category, id: { not: product.id } },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  let out = rank(same).slice(0, RELATED_LIMIT);

  if (out.length < RELATED_LIMIT) {
    const others = await prisma.product.findMany({
      where: { category: { not: product.category }, id: { not: product.id } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    out = out.concat(rank(others).slice(0, RELATED_LIMIT - out.length));
  }
  return out;
}

// GET /api/products/admin/list (admin)
// The admin products table needs EVERY product. The public list endpoint is
// capped at 60 per page and CDN-cached for 60s, so an admin with more than 60
// products only ever saw the first 60 (the rest looked "removed"), and a
// product added a moment ago could be missing from a stale cached list.
// This endpoint has no page cap and is never cached.
export const getAdminProducts = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const where = {};
  if (category) where.category = String(category);
  if (search) {
    where.OR = ['name', 'sku', 'fabric', 'color'].map((field) => ({
      [field]: { contains: String(search), mode: 'insensitive' },
    }));
  }
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: [{ createdAt: 'desc' }] }),
    prisma.product.count({ where }),
  ]);
  res.set('Cache-Control', 'no-store');
  res.json({ products: withMongoStyleId(items), total });
});

// GET /api/products/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const related = await findRelated(product);
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
  // Also drop the product from any Sutaara Edit that features it.
  const edits = await prisma.curatedEdit.findMany({ where: { productIds: { has: req.params.id } } });
  await prisma.$transaction([
    ...edits.map((e) =>
      prisma.curatedEdit.update({ where: { id: e.id }, data: { productIds: e.productIds.filter((id) => id !== req.params.id) } })
    ),
    prisma.product.delete({ where: { id: req.params.id } }),
  ]);
  res.json({ message: 'Product removed' });
});
