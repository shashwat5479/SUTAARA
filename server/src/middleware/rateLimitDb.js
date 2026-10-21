import { prisma } from '../config/db.js';

// Database-backed rate limiter.
//
// The in-memory express-rate-limit used in app.js only counts requests that hit
// the SAME serverless instance, so on Vercel an attacker is spread across many
// instances and barely gets slowed down. This one keeps the counter in
// Postgres (the existing AppKV table — no migration needed), so the limit
// holds across every instance. It fails OPEN: if the database hiccups, real
// customers are never locked out by the limiter itself.
//
//   dbRateLimit({ name: 'login', windowMs: 15 * 60_000, max: 8,
//                 key: (req) => `${req.ip}:${req.body?.email}` })
export function dbRateLimit({ name, windowMs, max, key, message }) {
  const keyFn = key || ((req) => req.ip);
  return async function limiter(req, res, next) {
    try {
      const raw = String(keyFn(req) ?? 'anon').toLowerCase().slice(0, 140);
      const k = `rl:${name}:${raw}`;
      const expiresAt = new Date(Date.now() + windowMs);
      const rows = await prisma.$queryRaw`
        INSERT INTO "AppKV" ("key", "value", "expiresAt", "updatedAt")
        VALUES (${k}, '1', ${expiresAt}, NOW() AT TIME ZONE 'UTC')
        ON CONFLICT ("key") DO UPDATE SET
          "value" = CASE
            WHEN "AppKV"."expiresAt" IS NULL OR "AppKV"."expiresAt" < (NOW() AT TIME ZONE 'UTC')
              THEN '1' ELSE (("AppKV"."value")::int + 1)::text END,
          "expiresAt" = CASE
            WHEN "AppKV"."expiresAt" IS NULL OR "AppKV"."expiresAt" < (NOW() AT TIME ZONE 'UTC')
              THEN ${expiresAt} ELSE "AppKV"."expiresAt" END,
          "updatedAt" = NOW() AT TIME ZONE 'UTC'
        RETURNING "value", "expiresAt"`;
      const count = Number(rows?.[0]?.value || 1);
      if (count > max) {
        const resetAt = rows?.[0]?.expiresAt ? new Date(rows[0].expiresAt).getTime() : Date.now() + windowMs;
        const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({
          message: message || 'Too many attempts — please wait a little while and try again.',
        });
      }
      // Tidy expired counters now and then so the table doesn't grow forever.
      if (Math.random() < 0.02) {
        prisma.$executeRaw`DELETE FROM "AppKV" WHERE "key" LIKE 'rl:%' AND "expiresAt" < (NOW() AT TIME ZONE 'UTC')`.catch(() => {});
      }
    } catch {
      /* fail open */
    }
    next();
  };
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const emailKey = (req) => `${req.ip}:${String(req.body?.email || '').trim()}`;

// Ready-made limits, tuned per endpoint. Sensitive ones (anything that sends an
// SMS/email, checks a password or a code) are strict; customer actions are loose.
export const limits = {
  login: [
    dbRateLimit({ name: 'login-id', windowMs: 15 * MIN, max: 8, key: emailKey, message: 'Too many sign-in attempts for this account. Please wait 15 minutes and try again.' }),
    dbRateLimit({ name: 'login-ip', windowMs: 15 * MIN, max: 40 }),
  ],
  register: dbRateLimit({ name: 'register', windowMs: HOUR, max: 10, message: 'Too many sign-up attempts. Please try again in an hour.' }),
  sendCode: [
    dbRateLimit({ name: 'code-id', windowMs: HOUR, max: 5, key: emailKey, message: 'Too many codes requested for this address. Please try again in an hour.' }),
    dbRateLimit({ name: 'code-ip', windowMs: HOUR, max: 20 }),
  ],
  verifyCode: dbRateLimit({ name: 'verify', windowMs: 15 * MIN, max: 10, key: emailKey }),
  demo: dbRateLimit({ name: 'demo', windowMs: HOUR, max: 5 }),
  coupon: dbRateLimit({ name: 'coupon', windowMs: 15 * MIN, max: 30, message: 'Too many coupon attempts. Please wait a few minutes.' }),
  subscribe: dbRateLimit({ name: 'subscribe', windowMs: HOUR, max: 6 }),
  appointment: dbRateLimit({ name: 'appointment', windowMs: HOUR, max: 10 }),
  review: dbRateLimit({ name: 'review', windowMs: HOUR, max: 10 }),
  order: dbRateLimit({ name: 'order', windowMs: HOUR, max: 25 }),
  payment: dbRateLimit({ name: 'payment', windowMs: HOUR, max: 60 }),
  returnRequest: dbRateLimit({ name: 'return', windowMs: HOUR, max: 10 }),
  trackVisit: dbRateLimit({ name: 'trk-visit', windowMs: HOUR, max: 300 }),
  trackEvent: dbRateLimit({ name: 'trk-event', windowMs: HOUR, max: 900 }),
  upload: dbRateLimit({ name: 'upload-sign', windowMs: HOUR, max: 300 }),
};
