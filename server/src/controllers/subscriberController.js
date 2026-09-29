import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';

// POST /api/subscribe — public. Upsert by email so resubscribing (or
// submitting twice) is idempotent instead of throwing a duplicate-key error,
// and reactivates anyone who'd previously unsubscribed.
export const subscribe = asyncHandler(async (req, res) => {
  const email = (req.body.email || '').toLowerCase().trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400);
    throw new Error('Enter a valid email address');
  }
  await prisma.subscriber.upsert({
    where: { email },
    update: { active: true },
    create: { email },
  });
  res.status(201).json({ message: 'Subscribed' });
});

// GET /api/admin/subscribers — admin+: full list, newest first
export const getSubscribers = asyncHandler(async (req, res) => {
  const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(withMongoStyleId(subs));
});

// DELETE /api/admin/subscribers/:id — admin+: remove a signup (e.g. a typo'd
// or spam address) rather than just marking inactive.
export const deleteSubscriber = asyncHandler(async (req, res) => {
  await prisma.subscriber.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});
