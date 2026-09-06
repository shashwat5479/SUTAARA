# Sutaara — setup & deploy

## What's in this build

- 34 products across 5 categories: 9 sarees, 7 suit sets, 7 blouses,
  7 dupattas, 4 potlis — all using your own photography.
- Admin panel at `/admin` (sign in as admin first) — create/edit/delete
  products with full specifications and up to 6 photos each, plus order
  management with status updates.
- Google Sign-In on the login/register pages, with the gift-box opening
  animation and a rotating saree slideshow behind it.
- Rotating saree slideshow on the homepage hero.
- Hover mega-menus on every nav item, with a dimmed page behind them.
- Mobile slide-in drawer menu.

## First-time local setup

```bash
# 1. Backend env
cd server
copy .env.example .env       # Windows  (cp on Mac/Linux)
# then open .env and fill in DATABASE_URL, DIRECT_URL, JWT_SECRET, GOOGLE_CLIENT_ID

npm install
npx prisma migrate dev --name init
npm run seed                 # loads all 34 products
npm run dev                  # API on http://localhost:5000

# 2. Frontend (second terminal)
cd client
copy .env.example .env       # then fill in VITE_GOOGLE_CLIENT_ID
npm install
npm run dev                  # site on http://localhost:5173
```

Admin login after seeding: **admin@sutaara.in** / **admin123**
(change this password before going live).

## Deploying to Vercel

This repo deploys as ONE Vercel project. In Vercel project settings:

- **Root Directory: leave BLANK** (not `client`, not `server`)
- **Environment Variables** — add each one and tick **all three**
  environments (Production, Preview, Development):
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `JWT_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `VITE_GOOGLE_CLIENT_ID`

Then push. Vercel runs the root `package.json` build, which generates the
Prisma client and builds the Vite client into `client/dist`.

### Why the root files matter

- `package.json` at the root declares `"type": "module"` and holds the API's
  dependencies. Vercel bundles the serverless function from `api/index.mjs`
  at the root, so it looks HERE for dependencies — not in `server/`.
  Without this file the function crashes with `Cannot find package 'dotenv'`.
- `api/index.mjs` uses the `.mjs` extension deliberately: it forces Node to
  treat it as an ES module. With a plain `.js` extension Vercel compiles it
  to CommonJS and it crashes with `ERR_REQUIRE_ESM`.
- **Never edit these two JSON files with PowerShell redirection**
  (`>` or `Out-File`) — it writes a BOM at the start of the file and Vercel
  fails the build with "not valid JSON". Edit them in VS Code instead.

### Seeding the live database

The seed script talks to whatever `DATABASE_URL` points at, so run it
locally with your production credentials in `server/.env`:

```bash
cd server
npx prisma migrate deploy
npm run seed
```

No redeploy needed after seeding — it only changes data, not code.

### Health check

`https://<your-domain>/api/debug` reports whether the env vars are visible
to the function and how many products the database holds. Useful when a
deploy looks wrong. Remove that route from `server/src/app.js` once you're
happy everything works.

## Email verification (stops fake sign-ups)

Password sign-ups now have to prove they own the address:

1. Register → account is created **unverified**, no session is issued.
2. A 6-digit code is emailed (valid 10 minutes, 5 attempts, hashed at rest).
3. Entering the code verifies the address and signs the person in.
4. Logging in before verifying re-sends a code and shows the code step.

**Google sign-ups skip this** — Google has already verified the address, so
those accounts are marked verified immediately.

Set the SMTP variables in `server/.env` (and in Vercel) or codes can't be
sent. Without SMTP configured the server logs the code to the console in
development, and **refuses password sign-ups entirely in production** rather
than letting people register into an account they can never access.

For Gmail: enable 2-factor auth, then create an **App Password** and use
that as `SMTP_PASS` — your normal password won't work.

Two edge cases are handled deliberately:

- **Squatting.** If someone registers an address they don't own and never
  verifies, the real owner can still sign up — an unverified account is an
  unproven claim, so a new sign-up takes it over and gets a fresh code.
  Verified and Google-linked accounts are never overwritten.
- **The seeded admin** is marked verified on creation, and an admin seeded
  before this feature existed gets marked verified on the next `npm run seed`
  — otherwise it would be locked out.

## Adding products from the admin panel

Sign in as an admin, go to `/admin`, and use the Products tab. Photos are
referenced by path — put the image file in `client/public/products/` and
enter `/products/your-file.jpg` in the form. The first photo is the one
shown on listing pages; the rest appear in the product gallery.
