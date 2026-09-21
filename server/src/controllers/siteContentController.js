import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';

/* ---------------- Hero slides ---------------- */

// GET /api/hero — public: active hero slides in order
export const getHeroSlides = asyncHandler(async (req, res) => {
  const slides = await prisma.heroSlide.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  });
  res.json(withMongoStyleId(slides));
});

// GET /api/hero/all — admin
export const getAllHeroSlides = asyncHandler(async (req, res) => {
  const slides = await prisma.heroSlide.findMany({ orderBy: { order: 'asc' } });
  res.json(withMongoStyleId(slides));
});

const heroData = (b) => ({
  title: String(b.title || ''),
  slug: String(b.slug || ''),
  images: Array.isArray(b.images) ? b.images.filter(Boolean).slice(0, 3) : [],
  order: Number(b.order) || 0,
  active: b.active === undefined ? true : Boolean(b.active),
});

export const createHeroSlide = asyncHandler(async (req, res) => {
  const slide = await prisma.heroSlide.create({ data: heroData(req.body) });
  res.status(201).json(withMongoStyleId(slide));
});

export const updateHeroSlide = asyncHandler(async (req, res) => {
  const slide = await prisma.heroSlide.update({ where: { id: req.params.id }, data: heroData(req.body) });
  res.json(withMongoStyleId(slide));
});

export const deleteHeroSlide = asyncHandler(async (req, res) => {
  await prisma.heroSlide.delete({ where: { id: req.params.id } });
  res.json({ message: 'Hero slide removed' });
});

/* ---------------- Exhibition slides ---------------- */

// GET /api/exhibition — public
export const getExhibitionSlides = asyncHandler(async (req, res) => {
  const slides = await prisma.exhibitionSlide.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  });
  res.json(withMongoStyleId(slides));
});

// GET /api/exhibition/all — admin
export const getAllExhibitionSlides = asyncHandler(async (req, res) => {
  const slides = await prisma.exhibitionSlide.findMany({ orderBy: { order: 'asc' } });
  res.json(withMongoStyleId(slides));
});

const exhibitionData = (b) => ({
  title: String(b.title || ''),
  subtitle: String(b.subtitle || ''),
  image: String(b.image || ''),
  link: String(b.link || ''),
  order: Number(b.order) || 0,
  active: b.active === undefined ? true : Boolean(b.active),
});

export const createExhibitionSlide = asyncHandler(async (req, res) => {
  const slide = await prisma.exhibitionSlide.create({ data: exhibitionData(req.body) });
  res.status(201).json(withMongoStyleId(slide));
});

export const updateExhibitionSlide = asyncHandler(async (req, res) => {
  const slide = await prisma.exhibitionSlide.update({ where: { id: req.params.id }, data: exhibitionData(req.body) });
  res.json(withMongoStyleId(slide));
});

export const deleteExhibitionSlide = asyncHandler(async (req, res) => {
  await prisma.exhibitionSlide.delete({ where: { id: req.params.id } });
  res.json({ message: 'Exhibition slide removed' });
});


/* ---------------- Curated Edits (Sutaara Edits menu + page) ---------------- */

// Resolves each edit's chosen productIds into real product objects (in the
// order they were picked), so the storefront can render actual product
// cards instead of only a link. Cheap no-op when no edit has products.
async function attachProducts(edits) {
  const allIds = [...new Set(edits.flatMap((e) => e.productIds || []))];
  if (allIds.length === 0) return edits.map((e) => ({ ...e, products: [] }));
  const products = await prisma.product.findMany({ where: { id: { in: allIds } } });
  const byId = new Map(products.map((p) => [p.id, p]));
  return edits.map((e) => ({
    ...e,
    products: (e.productIds || []).map((id) => byId.get(id)).filter(Boolean),
  }));
}

// GET /api/edits — public: active edits in order
export const getCuratedEdits = asyncHandler(async (req, res) => {
  const edits = await prisma.curatedEdit.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  });
  res.json(withMongoStyleId(await attachProducts(edits)));
});

// GET /api/edits/all — admin
export const getAllCuratedEdits = asyncHandler(async (req, res) => {
  const edits = await prisma.curatedEdit.findMany({ orderBy: { order: 'asc' } });
  res.json(withMongoStyleId(await attachProducts(edits)));
});

const editData = (b) => ({
  title: String(b.title || ''),
  description: String(b.description || ''),
  image: String(b.image || ''),
  link: String(b.link || ''),
  productIds: Array.isArray(b.productIds) ? b.productIds.filter(Boolean) : [],
  order: Number(b.order) || 0,
  active: b.active === undefined ? true : Boolean(b.active),
});

export const createCuratedEdit = asyncHandler(async (req, res) => {
  const edit = await prisma.curatedEdit.create({ data: editData(req.body) });
  res.status(201).json(withMongoStyleId(edit));
});

export const updateCuratedEdit = asyncHandler(async (req, res) => {
  const edit = await prisma.curatedEdit.update({ where: { id: req.params.id }, data: editData(req.body) });
  res.json(withMongoStyleId(edit));
});

export const deleteCuratedEdit = asyncHandler(async (req, res) => {
  await prisma.curatedEdit.delete({ where: { id: req.params.id } });
  res.json({ message: 'Curated edit removed' });
});

/* ---------------- Category tiles ("Shop by category" on homepage) ---------------- */

const DEFAULT_CATEGORY_TILES = [
  { key: 'saree',   label: 'Sarees',     note: 'Drape',     image: '/products/mauve-kalamkari-peacock-1.jpg', order: 0 },
  { key: 'suit',    label: 'Suit Sets',  note: 'Everyday',  image: '/products/rose-emerald-suit-1.jpg',        order: 1 },
  { key: 'blouse',  label: 'Blouses',    note: 'Statement', image: '/products/magenta-emerald-set-2.jpg',      order: 2 },
  { key: 'dupatta', label: 'Dupattas',   note: 'Drape',     image: '/products/peach-leheriya-organza-3.jpg',   order: 3 },
  { key: 'potli',   label: 'Potli Bags', note: 'Finish',    image: '/products/mustard-turquoise-set-2.jpg',    order: 4 },
];

// First read ever (of either endpoint below) seeds the 5 fixed tiles from
// the values that used to be hardcoded in Home.jsx, so the homepage never
// shows blank tiles before an admin has touched this panel.
async function ensureCategoryTilesSeeded() {
  const count = await prisma.categoryTile.count();
  if (count > 0) return;
  await prisma.categoryTile.createMany({ data: DEFAULT_CATEGORY_TILES, skipDuplicates: true });
}

// GET /api/category-tiles — public: active tiles in order
export const getCategoryTiles = asyncHandler(async (req, res) => {
  await ensureCategoryTilesSeeded();
  const tiles = await prisma.categoryTile.findMany({ where: { active: true }, orderBy: { order: 'asc' } });
  res.json(withMongoStyleId(tiles));
});

// GET /api/category-tiles/all — admin: every tile, including inactive
export const getAllCategoryTiles = asyncHandler(async (req, res) => {
  await ensureCategoryTilesSeeded();
  const tiles = await prisma.categoryTile.findMany({ orderBy: { order: 'asc' } });
  res.json(withMongoStyleId(tiles));
});

// PUT /api/category-tiles/:id — admin: edit an existing tile's label/note/
// image/order/active. Fixed set, so this is update-only, no create/delete.
export const updateCategoryTile = asyncHandler(async (req, res) => {
  const { label, note, image, order, active } = req.body;
  const data = {};
  if (label !== undefined) data.label = String(label);
  if (note !== undefined) data.note = String(note);
  if (image !== undefined) data.image = String(image);
  if (order !== undefined) data.order = Number(order) || 0;
  if (active !== undefined) data.active = Boolean(active);
  const tile = await prisma.categoryTile.update({ where: { id: req.params.id }, data });
  res.json(withMongoStyleId(tile));
});

/* ---------------- Announcement bar ---------------- */

// GET /api/announcement — public: the active announcement (or null)
export const getAnnouncement = asyncHandler(async (req, res) => {
  const a = await prisma.announcement.findFirst({
    where: { active: true },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(a ? withMongoStyleId(a) : null);
});

// GET /api/announcement/all — admin
export const getAllAnnouncements = asyncHandler(async (req, res) => {
  const list = await prisma.announcement.findMany({ orderBy: { updatedAt: 'desc' } });
  res.json(withMongoStyleId(list));
});

// PUT /api/announcement — admin: upsert the single announcement
export const saveAnnouncement = asyncHandler(async (req, res) => {
  const message = String(req.body.message || '');
  const active = req.body.active === undefined ? true : Boolean(req.body.active);
  const existing = await prisma.announcement.findFirst({ orderBy: { updatedAt: 'desc' } });
  let a;
  if (existing) {
    a = await prisma.announcement.update({ where: { id: existing.id }, data: { message, active } });
  } else {
    a = await prisma.announcement.create({ data: { message, active } });
  }
  res.json(withMongoStyleId(a));
});

