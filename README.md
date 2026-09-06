# Sutaara — E-commerce Platform (v2)

React + Vite storefront/admin, Express API, **PostgreSQL via Prisma**.

This version replaces MongoDB with PostgreSQL, fixes the bugs listed below,
adds order-lifecycle automation (invoice, packing slip, shipping label,
"print all"), coupons, and a lightweight "vintage storybook" reskin of the
homepage. It is one solid step toward a Myntra-scale build, not a full
clone — see "What's still missing for real scale" at the bottom.

## 1. Setup

### Database
You need a PostgreSQL instance — local, or a free hosted one (Neon, Supabase,
Railway all work and are the easiest way to skip local Postgres setup).

```bash
cd server
cp .env.example .env
# edit .env — set DATABASE_URL to your Postgres connection string
npm install
npx prisma migrate dev --name init   # creates all tables
npm run seed                          # 11 products, 2 coupons, admin user
npm run dev                           # API on :5000
```

### Frontend
```bash
cd client
npm install
npm run dev   # :5173, proxies /api to the backend
```

Seed admin login: `admin@sutaara.in` / `admin123` (change `ADMIN_PASSWORD` in
`server/.env` before you seed production data).

Sample coupons after seeding: `WELCOME10` (10% off ₹1,500+, capped at ₹1,000)
and `FESTIVE500` (flat ₹500 off ₹3,500+).

## 2. What changed from the MongoDB version

**Database**
- Mongoose models → Prisma schema (`server/prisma/schema.prisma`), Postgres tables with real foreign keys instead of loose ObjectId refs.
- API responses still include `_id` alongside `id` so the existing React frontend didn't need a rewrite.

**Bugs fixed**
- Stock was never decremented on checkout — two customers could both buy the last unit of a size. Order creation now runs in a DB transaction that checks and deducts stock atomically.
- Deleting a product that had past orders would corrupt order history; deletion is now blocked with a clear message if the product has orders (unpublish it instead).
- Login didn't run `bcrypt.compare` when the email didn't exist, which leaks (via timing) whether an email is registered. Fixed to always compare.
- Duplicate product names could silently collide on slug or throw a raw DB error; slugs are now auto-de-duplicated (`-2`, `-3`, ...).
- Generic Mongoose error handling (`ValidationError`, `CastError`, code `11000`) replaced with Prisma's actual error codes (`P2002`, `P2025`, `P2003`) — a raw duplicate key error would have leaked as an unhandled 500 before.
- No rate limiting or security headers existed despite being in the feature brief; added `helmet` + `express-rate-limit` (stricter on `/api/auth`).

**Google Sign-In (needs a free API key — see below)**
- `POST /api/auth/google` verifies the Google ID token server-side (`google-auth-library`), creates the account on first sign-in, links Google to an existing email/password account if one matches, or logs in an existing Google account.
- `User.password` is now nullable and `googleId`/`authProvider`/`avatar` were added — re-run `npx prisma migrate dev` after pulling this update.
- Frontend: a "Continue with Google" button (Google Identity Services) on both `/login` and `/register`; renders nothing if `VITE_GOOGLE_CLIENT_ID` isn't set, so it degrades gracefully in dev.

**New features (no API key needed)**
- Automatic **invoice** generation and PDF download, numbered `INV-<year>-<seq>`.
- Automatic **packing slip** PDF.
- Automatic **shipping label** PDF with a scannable QR code (order + AWB).
- **"Print All"** — merges all three into one PDF for the admin.
- Full **order status lifecycle** (`pending → confirmed → processing → packed → shipped → out_for_delivery → delivered`, plus `cancelled`/return/refund states) with an audit trail (`StatusEvent`) for a tracking timeline.
- **Stock auto-restores** on cancellation or approved return.
- **Coupons**: percent/flat, min order value, max discount cap, usage limits, expiry.
- **Saved addresses** — a customer can store more than one delivery address.

**Design**
- Homepage reframed as a short "storybook" — chapter markers, a prologue, a drop-cap paragraph, a sepia-toned editorial photo. Same palette/typography as before (warm ivory, sindoor red, antique gold, Cormorant Garamond + Jost) — this is a layer on top, not a redesign.

## 3. Features that need a paid API key (not wired up — pick a provider when you're ready)

| Feature | What you'd need | Where it plugs in |
|---|---|---|
| **Payments (online)** | Razorpay or Stripe account + keys | `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` in `.env`; checkout currently supports COD only, "online" is a stub |
| **Courier / AWB / live tracking** | Shiprocket, Delhivery, Shadowfax, etc. | `server/src/services/shipping.js` — currently returns a mock AWB so labels/print-all still work in dev; swap in the real API call |
| **SMS/email OTP, order emails** | MSG91/Twilio (SMS), SendGrid/AWS SES (email) | `SMS_API_KEY` / `EMAIL_API_KEY` in `.env` — not called anywhere yet |
| **WhatsApp order notifications** | WhatsApp Business Cloud API token | `WHATSAPP_API_TOKEN` in `.env` |
| **AI search / recommendations / visual search** | OpenAI/Anthropic or a vector-search service | Phase 2/3 item, not started |
| **Google Sign-In** | Google OAuth Client ID (free, Google Cloud Console) | `GOOGLE_CLIENT_ID` in `server/.env` + `VITE_GOOGLE_CLIENT_ID` in `client/.env` — wired up, see below |

### Setting up Google Sign-In (free, ~5 minutes)
1. [Google Cloud Console](https://console.cloud.google.com/) → create/select a project → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID → Web application**.
3. Under **Authorized JavaScript origins** add `http://localhost:5173` (and your production domain later).
4. Copy the generated **Client ID** into both `server/.env` (`GOOGLE_CLIENT_ID`) and `client/.env` (`VITE_GOOGLE_CLIENT_ID`) — same value in both.
5. Restart both dev servers. The "Continue with Google" button appears on `/login` and `/register` automatically; until it's set, that button just doesn't render and email/password login keeps working.

First Google sign-in creates the account automatically (or links Google to an existing email if it matches); no separate "register with Google" step needed.

## 5. Deploying to Vercel
See [`DEPLOY.md`](./DEPLOY.md) for the full walkthrough — one Vercel project builds both the storefront and the API from a single `git push`, plus a hosted Postgres provider and a "scaling to ~10k users" section.

Until these are configured, the platform is fully functional for COD orders,
invoicing, packing, labeling, and admin order management — everything except
the pieces that inherently require a paid third-party service.

## 4. What's still missing for real "Myntra scale"

Being honest about scope: a single response can harden the data layer, close
real bugs, and wire up the automation that's pure code. It can't stand up a
production-grade payment integration, a live courier contract, CDN/image
pipeline, search infrastructure, or load-tested infra in one pass — those
need actual accounts/credentials and real traffic to tune. Treat this as the
backend now being on a proper relational database with the right integrity
and automation in place to build the rest on top of.
