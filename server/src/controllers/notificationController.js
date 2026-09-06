import { prisma } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';
import { withMongoStyleId } from '../utils/serialize.js';

// GET /api/notification-settings (super admin)
export const getNotificationSettings = asyncHandler(async (req, res) => {
  let s = await prisma.notificationSettings.findFirst();
  if (!s) s = await prisma.notificationSettings.create({ data: {} });
  res.json(withMongoStyleId(s));
});

// PUT /api/notification-settings (super admin)
export const saveNotificationSettings = asyncHandler(async (req, res) => {
  const { alertEmail, alertWhatsApp, emailEnabled } = req.body;
  let s = await prisma.notificationSettings.findFirst();
  const data = {
    alertEmail: alertEmail !== undefined ? String(alertEmail).trim() : undefined,
    alertWhatsApp: alertWhatsApp !== undefined ? String(alertWhatsApp).trim() : undefined,
    emailEnabled: emailEnabled !== undefined ? Boolean(emailEnabled) : undefined,
  };
  if (s) {
    s = await prisma.notificationSettings.update({ where: { id: s.id }, data });
  } else {
    s = await prisma.notificationSettings.create({ data: { ...data } });
  }
  res.json(withMongoStyleId(s));
});
