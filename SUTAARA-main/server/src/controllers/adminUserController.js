import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';
import { rankOf } from '../middleware/auth.js';

// Fields safe to return — NEVER include password.
const SAFE = { id: true, name: true, email: true, role: true, phone: true, emailVerified: true, authProvider: true, createdAt: true };

const MANAGEABLE_ROLES = ['staff', 'admin']; // superadmin is never created/edited via this API

// GET /api/admin/users — superadmin: list staff/admin accounts (not customers)
export const listStaff = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: { in: ['staff', 'admin', 'superadmin'] } },
    select: SAFE,
    orderBy: { createdAt: 'desc' },
  });
  res.json(withMongoStyleId(users));
});

// POST /api/admin/users — superadmin: create a staff or admin account
export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password and role are required');
  }
  if (!MANAGEABLE_ROLES.includes(role)) {
    res.status(400);
    throw new Error('Role must be staff or admin');
  }
  // Hierarchy: you can never create an account at or above your own level.
  if (rankOf(role) >= rankOf(req.user.role)) {
    res.status(403);
    throw new Error('You cannot create an account at or above your own level');
  }
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    res.status(409);
    throw new Error('A user with that email already exists');
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role,
      authProvider: 'password',
      emailVerified: true, // staff accounts are trusted, created by superadmin
    },
    select: SAFE,
  });
  res.status(201).json(withMongoStyleId(user));
});

// Guard: fetch the target and ensure the actor outranks them.
async function loadManageableTarget(req, res) {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) {
    res.status(404);
    throw new Error('User not found');
  }
  // You can only act on someone strictly below your level. This blocks a
  // lower/equal user from modifying a higher one even via a direct API call.
  if (rankOf(target.role) >= rankOf(req.user.role)) {
    res.status(403);
    throw new Error('You cannot modify a user at or above your own level');
  }
  return target;
}

// PUT /api/admin/users/:id/role — superadmin: change a lower user's role
export const changeRole = asyncHandler(async (req, res) => {
  const target = await loadManageableTarget(req, res);
  const { role } = req.body;
  if (!MANAGEABLE_ROLES.includes(role)) {
    res.status(400);
    throw new Error('Role must be staff or admin');
  }
  if (rankOf(role) >= rankOf(req.user.role)) {
    res.status(403);
    throw new Error('You cannot promote a user to your level or above');
  }
  const updated = await prisma.user.update({ where: { id: target.id }, data: { role }, select: SAFE });
  res.json(withMongoStyleId(updated));
});

// PUT /api/admin/users/:id/password — superadmin: RESET (never reveal) a password
export const resetPassword = asyncHandler(async (req, res) => {
  const target = await loadManageableTarget(req, res);
  const { password } = req.body;
  if (!password || password.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters');
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: target.id }, data: { password: hashed } });
  res.json({ message: 'Password reset' });
});

// DELETE /api/admin/users/:id — superadmin: remove a lower staff/admin account
export const deleteStaff = asyncHandler(async (req, res) => {
  const target = await loadManageableTarget(req, res);
  // Convert to a normal customer rather than hard-delete, to preserve any
  // orders/records tied to them. Safer than a cascading delete.
  await prisma.user.update({ where: { id: target.id }, data: { role: 'user' } });
  res.json({ message: 'Account access removed' });
});
