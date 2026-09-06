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

