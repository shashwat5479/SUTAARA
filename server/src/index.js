// Local dev entry point — connects to Postgres, then listens.
// Not used on Vercel (see api/index.js), where the platform calls the
// exported app directly per-request instead of a long-running listener.
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
