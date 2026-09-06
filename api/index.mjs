// Single-project Vercel entry point. This is the only serverless function
// in the app — every /api/* request routes here (see root vercel.json).
// It re-exports the same Express app used for local dev in server/src/app.js,
// so there is exactly one place that defines routes/middleware.
import app from '../server/src/app.js';

export default app;
