# Deploying Sutaara to Vercel — one project, one push

Everything (storefront + API) deploys as a **single Vercel project** from
the repo root. `git push` → one build → done. No separate client/server
projects to keep in sync.

## How it works
- `vercel.json` at the repo root builds `client/` with Vite and serves the
  output as static files.
- `api/index.js` at the repo root is the one serverless function — it
  re-exports the same Express app (`server/src/app.js`) used for local dev.
- `/api/*` requests route to that function; every other route falls back to
  `index.html` so React Router's client-side routing works.

## 1. Push to GitHub
```bash
cd sutaara
git add .
git commit -m "single-project vercel setup"
git push
```
(`.env` files are already git-ignored — see the note at the bottom if you
need to double check nothing sensitive got committed.)

## 2. Hosted Postgres
If you're not already on one: [Neon](https://neon.tech), [Supabase](https://supabase.com),
or Prisma Postgres all work. Get two connection strings — pooled and direct
(Prisma Postgres calls these `pooled.db.prisma.io` and `db.prisma.io`; Neon/
Supabase show both on their connection-details page).

## 3. Import the project — once
[vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
- **Root Directory**: leave blank (repo root) — this is the key difference
  from the old two-project setup.
- **Framework Preset**: "Other" (the `vercel.json` build settings override
  auto-detection anyway).

**Environment Variables** — all of these go on this one project:

| Key | Value |
|---|---|
| `DATABASE_URL` | pooled connection string |
| `DIRECT_URL` | direct connection string |
| `JWT_SECRET` | long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `GOOGLE_CLIENT_ID` | your OAuth Client ID |
| `CLIENT_URL` | leave unset — same-origin now, CORS isn't in play for same-domain requests |

Don't set `VITE_API_URL` — the frontend already defaults to `/api`, which
is same-origin in this setup.

Deploy. You get one URL, e.g. `https://sutaara.vercel.app`, serving both
the storefront and `/api/*`.

## 4. Migrate + seed (once, from your own machine)
```bash
cd server
cp .env.example .env   # fill in DATABASE_URL / DIRECT_URL
npx prisma migrate deploy
npm run seed
```

## 5. Finish Google Sign-In
Add `https://sutaara.vercel.app` (your real domain) to **Authorized
JavaScript origins** on your OAuth client in Google Cloud Console.
Set `VITE_GOOGLE_CLIENT_ID` in the Vercel project's env vars too — the
frontend needs it at build time, same value as `GOOGLE_CLIENT_ID`.

## 6. Every deploy after this
Just `git push`. That's the "one go" — one project, one build, one URL.

---

## Scaling to ~10,000 users

What's already in place for this:
- **Serverless API** — Vercel spins up more instances automatically under
  load; there's no single server to fall over. No changes needed here.
- **Pooled DB connections** — required for serverless + Postgres; without
  it, concurrent cold starts exhaust Postgres's connection limit fast. This
  is why step 2 above insists on the pooled string for `DATABASE_URL`.
- **CDN caching on product/catalog reads** — `GET /api/products`,
  `/api/products/facets`, and `/api/products/:slug` now send
  `Cache-Control: s-maxage=60, stale-while-revalidate=300`. Vercel's edge
  serves these straight from cache for most visitors instead of hitting
  the function or the database on every page view — the highest-traffic
  reads in the app.
- **Gzip/Brotli compression** on all API responses (`compression`
  middleware) — smaller payloads, faster loads on mobile networks.
- **Rate limiting** (300 req/15min general, 30 req/15min on `/api/auth`) —
  protects against one client hammering the API and starving others.
- **Prisma client reuse across warm invocations** (`server/src/config/db.js`)
  — avoids opening a fresh DB connection on every request.
- **DB-level indexes** on the columns actually filtered/sorted on
  (category, status, userId, etc. — see `schema.prisma`).

What you'd add next if traffic actually gets there (none of this is needed
to launch — these are the next levers, roughly in the order they'd matter):
1. **Upgrade Vercel's plan** if you're on Hobby — it has stricter function
   concurrency/bandwidth limits than a real storefront wants.
2. **Image optimization/CDN for product photos** — they're currently served
   as-is from `client/public`. A dedicated image CDN (Cloudinary, or
   Vercel's own Image Optimization) resizes/serves WebP automatically and
   is usually the single biggest page-speed win for an e-commerce catalog.
3. **A proper search index** (Postgres full-text or a hosted service like
   Algolia/Meilisearch) once the catalog and search traffic outgrow simple
   `WHERE ... ILIKE` queries.
4. **Move checkout's stock-check transaction off the connection pool's hot
   path** if flash sales become a thing — a short-lived Redis lock or a
   queue in front of order creation prevents pool exhaustion during a spike,
   though the current transaction is already safe against overselling.
5. **Structured logging/monitoring** (e.g. Vercel's own observability, or
   Sentry) — right now errors just go to the function logs; at real scale
   you want alerting, not log-tailing.

None of this needs to happen before launch. The architecture doesn't have a
hard ceiling around 10k users — it's normal e-commerce growth work from
here, done incrementally as real traffic tells you where it actually hurts.

## Note on `.env` and git
Both `client/.gitignore` and `server/.gitignore` exclude `.env` already.
If you ever pushed a real `.env` by mistake (including via GitHub's web
upload, which ignores `.gitignore`), remove it from the repo and rotate
whatever credentials were in it — a `git rm --cached` alone doesn't erase
it from history on a repo others could already see.
