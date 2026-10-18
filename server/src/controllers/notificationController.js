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
// The form sends alertEmail1..3 (up to three recipients), a WhatsApp number and
// the email toggle. Only fields present in the body are updated.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const saveNotificationSettings = asyncHandler(async (req, res) => {
  const { alertEmail1, alertEmail2, alertEmail3, alertWhatsApp, emailEnabled } = req.body;

  const data = {};
  const emails = { alertEmail1, alertEmail2, alertEmail3 };
  for (const [key, raw] of Object.entries(emails)) {
    if (raw === undefined) continue;
    const v = String(raw ?? '').trim().toLowerCase();
    if (v && !EMAIL_RE.test(v)) {
      res.status(400);
      throw new Error(`"${raw}" is not a valid email address`);
    }
    data[key] = v;
  }
  if (alertWhatsApp !== undefined) data.alertWhatsApp = String(alertWhatsApp ?? '').trim();
  if (emailEnabled !== undefined) data.emailEnabled = Boolean(emailEnabled);

  let s = await prisma.notificationSettings.findFirst();
  if (s) {
    s = await prisma.notificationSettings.update({ where: { id: s.id }, data });
  } else {
    s = await prisma.notificationSettings.create({ data });
  }
  res.json(withMongoStyleId(s));
});
