# Complete fix — these are FULL files, not patches. Replace outright.

Every previous batch gave you snippets to paste in — your screenshots show
several of those never actually landed (the faded-text bug is still there,
the Shipping column isn't in your admin table). So this time every file
below is the **complete, final version** — delete what's there and drop
these in wholesale. No find-and-replace, no pasting into the middle of a
file.

## 1. The faded-text bug — still live because the fix wasn't applied yet

**File:** `client/src/styles/index.css` (full file — 4973 lines)

Confirmed from your screenshots: the admin order table's customer
names/emails, and the "Used for WhatsApp order alerts..." hint text, were
both washed-out white-on-cream — the exact same bug I found before
(`body { color: rgba(255,255,255,0.7) }`). It's fixed in this file (now
`var(--ink)`), plus I added a proper style for `.field__hint` (the
WhatsApp hint text), which had **no CSS rule at all** before — a second,
smaller bug on top of the first.

Just replace your entire `index.css` with this one.

## 2. "Not your order" when downloading another customer's invoice — real bug, fixed

**File:** `server/src/controllers/documentController.js`

The permission check only special-cased the exact string `'admin'`:
```js
if (!owns && req.user.role !== 'admin') { throw new Error('Not your order'); }
```
But your account (and any staff account) might have role `staff` or
`superadmin` — neither of which is the literal string `'admin'` — so it
was blocking you from downloading invoices/labels for orders that aren't
your own personal account's orders, even though you're the admin. Fixed to
check against all three roles (`staff`, `admin`, `superadmin`).

## 3. What "Order notifications" in the admin panel actually does

You asked for an explanation — here it is:

- **"Alert email 1/2/3"** — up to 3 email addresses that get pinged every
  time a **new order comes in**. This is for YOU (the store owner/team),
  not the customer. Leave 2 and 3 blank if you only want one person
  notified.
- **"Alert WhatsApp number"** — same idea but for WhatsApp, though this is
  a placeholder for now — the hint text under it ("activates once the
  WhatsApp provider is connected") means the actual WhatsApp sending isn't
  wired up yet; you'd need to add a WhatsApp Business API provider (like
  Twilio or Gupshup) for that number to actually receive anything.
- **"Send email alerts for new orders"** checkbox — a master on/off switch
  for the alert emails above. Turning it off does NOT stop customer emails
  (order confirmation, shipped, delivered) — those are separate and always
  send. This switch only controls whether YOU get pinged about new orders.
- The customer-facing emails (order placed → confirmed → shipped →
  delivered → return/refund) are **completely separate** from this
  settings page — those fire automatically for every order regardless of
  what's configured here, and don't need any settings.

## 4. The delivery/shipping system — Shiprocket + manual, built

**Files:** `client/src/pages/Admin.jsx`, `client/src/api/client.js`,
`server/src/controllers/orderController.js`,
`server/src/controllers/shippingWebhookController.js`,
`server/src/routes/orders.js`, `server/src/services/shipping.js`,
`server/prisma/schema.prisma` + its migration

This is the same feature I built in the last two messages — re-included in
full here since your screenshot shows the admin table is still missing
the "Shipping" column, meaning it never got applied. Once you drop these
files in:

- Admin Orders tab gets a new **"Shipping"** column between Status and
  Return/Refund
- **"Ship with Shiprocket"** button (gold) — one click: creates the
  Shiprocket shipment, auto-picks a courier, gets the AWB, schedules
  pickup, emails the customer with tracking — only shows once you've set
  `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` env vars
- **"Ship manually"** button — always available, opens a small form to
  type in AWB number / courier name / tracking URL by hand, for shipments
  outside Shiprocket
- Once shipped: shows the AWB, courier, a "Track" link, and (Shiprocket
  shipments only) a "Print label" button

## Setup steps — do these in order

```bash
# 1. Delete and replace every file listed above with the ones in this package

# 2. Add the missing razorpay dependency + run the new migration
cd server
$env:DATABASE_URL = "your_production_connection_string"
npx prisma migrate deploy

# 3. Push
cd ..
git add .
git commit -m "fix: css faded-text bug, admin invoice permission, shiprocket shipping UI"
git push
```

If you haven't set the Shiprocket env vars yet (`SHIPROCKET_EMAIL`,
`SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION`), the "Ship with
Shiprocket" button just won't appear — "Ship manually" always works
regardless, so nothing is blocked while you get Shiprocket set up.
