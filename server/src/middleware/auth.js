import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

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

// Gate admin-only routes; use after protect
export function admin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access only' });
}
