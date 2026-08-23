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
import couponRoutes from './routes/coupons.js';

// Express app only — no app.listen() and no DB connect call here, so this
// file can be imported both by the local dev server (src/index.js) and by
// the Vercel serverless entry (api/index.js) without side effects.
const app = express();

app.set('trust proxy', 1); // needed behind Vercel's proxy for rate-limit/IP to work correctly

// Gzip/Brotli-negotiated compression on every JSON response — this is a real
// cost/speed win once traffic grows: product listings can be 50-100KB
// uncompressed, compression gets that under 15KB on the wire.
app.use(compression());

app.use(helmet());
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
app.use(express.json({ limit: '2mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'sutaara-api', db: 'postgresql' }));

// TEMPORARY debug route — surfaces the real reason product queries fail on
// Vercel instead of a blank 500. Remove once the deployment is confirmed working.
app.get('/api/debug', async (req, res) => {
  const out = { env: {}, prisma: {} };
  out.env.DATABASE_URL = process.env.DATABASE_URL ? 'set' : 'MISSING';
  out.env.DIRECT_URL = process.env.DIRECT_URL ? 'set' : 'MISSING';
  out.env.NODE_ENV = process.env.NODE_ENV || 'unset';
  try {
    const { prisma } = await import('./config/db.js');
    out.prisma.productCount = await prisma.product.count();
    out.prisma.ok = true;
  } catch (e) {
    out.prisma.ok = false;
    out.prisma.error = e.message;
    out.prisma.name = e.name;
    out.prisma.code = e.code;
  }
  res.json(out);
});

app.get('/', (req, res) => res.json({ status: 'ok', service: 'sutaara-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
