import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

// Role hierarchy — higher number = more power. A user at a given level
// automatically satisfies every requirement at or below their level.
const RANK = { user: 0, staff: 1, admin: 2, superadmin: 3 };

export function rankOf(role) {
  return RANK[role] ?? 0;
}

// Verifies the Bearer token and attaches req.user
export async function protect(req, res, next) {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized — token invalid' });
  }
}

// Factory: require at least the given role level. Use after protect.
export function requireRole(minRole) {
  const min = RANK[minRole] ?? 99;
  return (req, res, next) => {
    if (req.user && rankOf(req.user.role) >= min) return next();
    return res.status(403).json({ message: 'You do not have permission to do that' });
  };
}

// Convenience guards (all assume protect ran first).
export const staffOrAbove = requireRole('staff');   // staff, admin, superadmin
export const adminOrAbove = requireRole('admin');   // admin, superadmin
export const superAdminOnly = requireRole('superadmin');

// Backwards-compatible: existing routes import { admin }. It now means
// "admin or above" so a superadmin also passes. Existing admin accounts keep
// working exactly as before.
export const admin = adminOrAbove;
