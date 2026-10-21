import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import compression from 'compression';
import { notFound, errorHandler } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import returnRoutes from './routes/returns.js';
import { handleShippingWebhook } from './controllers/shippingWebhookController.js';
import { handleRefundWebhook } from './controllers/returnController.js';
import couponRoutes from './routes/coupons.js';
import appointmentRoutes from './routes/appointments.js';
import studioEventRoutes from './routes/studioEvent.js';
import reviewRoutes from './routes/reviews.js';
import siteContentRoutes from './routes/siteContent.js';
import adminUserRoutes from './routes/adminUsers.js';
import analyticsRoutes from './routes/analytics.js';
import trackRoutes from './routes/track.js';
import uploadRoutes from './routes/uploads.js';
import subscribeRoutes from './routes/subscribe.js';
import adminSubscribersRoutes from './routes/adminSubscribers.js';
import notificationSettingsRoutes from './routes/notificationSettings.js';
import paymentRoutes from './routes/payments.js';
import { handleRazorpayWebhook } from './controllers/paymentController.js';

// Express app only — no app.listen() and no DB connect call here, so this
// file can be imported both by the local dev server (src/index.js) and by
// the Vercel serverless entry (api/index.js) without side effects.
const app = express();

app.set('trust proxy', 1); // needed behind Vercel's proxy for rate-limit/IP to work correctly

// Misconfiguration alarms (logged, never fatal — a crash would take the shop offline).
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('[security] JWT_SECRET is missing or shorter than 32 characters — set a long random value in Vercel.');
  }
  if (process.env.ALLOW_DEMO_LOGIN === 'true') {
    console.error('[security] ALLOW_DEMO_LOGIN=true — anyone can create an account without a password. Turn it off.');
  }
  if (!process.env.SHIPPING_WEBHOOK_SECRET) {
    console.error('[security] SHIPPING_WEBHOOK_SECRET is not set — the courier webhook is disabled.');
  }
}

// Gzip/Brotli-negotiated compression on every JSON response — this is a real
// cost/speed win once traffic grows: product listings can be 50-100KB
// uncompressed, compression gets that under 15KB on the wire.
app.use(compression());

// Security headers. The API only ever returns JSON, so it gets the strictest
// policy; HSTS forces HTTPS for two years; the site can't be put in someone
// else's frame (clickjacking) and browsers must trust the declared content type.
app.disable('x-powered-by');
app.use(
  helmet({
    hsts: { maxAge: 63072000, includeSubDomains: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // the SPA calls the API from the same site; images are not served from here
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"] },
    },
  })
);

// Responses that carry personal or account data must never be stored by a
// browser cache, proxy or CDN.
const NO_STORE = ['/api/auth', '/api/admin', '/api/orders', '/api/payments', '/api/returns', '/api/notification-settings'];
app.use((req, res, next) => {
  if (NO_STORE.some((p) => req.path.startsWith(p))) res.set('Cache-Control', 'no-store');
  next();
});
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { message: 'Too many attempts, try again later' } })
);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
// Razorpay webhook — MUST be registered before express.json() below, using
// express.raw(), because signature verification needs the exact raw bytes
// Razorpay signed. Any request matching this exact path is fully handled
// here and never reaches the global json parser.
app.post(
  '/api/payments/razorpay/webhook',
  express.raw({ type: '*/*' }),
  handleRazorpayWebhook
);

// Public endpoints never need big bodies — cap them so they can't be used to burn memory.
app.use(['/api/track', '/api/subscribe', '/api/auth'], express.json({ limit: '20kb' }));
app.use(express.json({ limit: '2mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'sutaara-api', db: 'postgresql' }));

app.get('/', (req, res) => res.json({ status: 'ok', service: 'sutaara-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/payments', paymentRoutes);
app.post('/api/shipping/webhook', handleShippingWebhook);
// Razorpay refund.processed webhook — auto-marks return as settled
app.post('/api/payments/razorpay/refund-webhook', express.raw({ type: '*/*' }), handleRefundWebhook);
app.use('/api/coupons', couponRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/studio-event', studioEventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', siteContentRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/track', trackRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/admin/subscribers', adminSubscribersRoutes);
app.use('/api/notification-settings', notificationSettingsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;