# Sutaara security checklist

Code protections are in the repo. The items below are things only the account
owner can do, because they live in dashboards, not code. Do the top ones first.

## Do these now
1. **Change the Shiprocket API-user password.** Part of it appeared in a screenshot of `.env`.
   Then update `SHIPROCKET_PASSWORD` in Vercel and redeploy.
2. **Vercel environment variables** (Project → Settings → Environment Variables):
   - `JWT_SECRET` — at least 32 random characters. Generate one:
     `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
     Changing it signs every user out once (that is fine).
   - `ALLOW_DEMO_LOGIN` — must be `false` or unset in production.
   - `SHIPPING_WEBHOOK_SECRET` — set (random string).
3. **Cloudinary: close the open upload door.** After you confirm that uploading a product photo in the
   admin panel still works (it now uses signed uploads), go to Cloudinary → Settings → Upload → Upload presets,
   open `sutaara_unsigned` and set **Signing mode: Signed** (or delete it). Until then anyone who finds the
   preset name can upload to your account and use up your credits.
4. **Turn on two-factor authentication (2FA)** on every account that can hurt the shop:
   GitHub, Vercel, Cloudinary, Razorpay, Shiprocket, GoDaddy (domain + mail), your database host, Google.
   A stolen password for any of these is worse than any bug in the code.

## Recommended
- GitHub → Settings → Branches: protect `main` (require a pull request). Turn on Dependabot alerts.
- Vercel → Settings → Deployment Protection: protect preview deployments.
- Razorpay: restrict API key permissions; set a webhook secret and keep it in Vercel only.
- Database: keep automatic backups on, and test a restore once.
- Run `npm audit` in `client/` and `server/` once a month.
- Keep `.env` files out of git (already in `.gitignore`). Never paste `.env` contents or screenshots into chats.

## Content-Security-Policy (CSP)
`vercel.json` enforces a safe CSP subset (no framing, no plugins, fixed base URL) and runs a stricter
policy in **report-only** mode. Browse the site (sign in with Google, pay with Razorpay, upload an image) with
DevTools → Console open. If no "Content Security Policy" warnings appear, change the header name
`Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `vercel.json` to enforce it.
