# Razorpay integration — what changed & how to wire it up

## What this does

Implements the full flow from your diagram:

```
Checkout → Sutaara Backend → Create Razorpay Order → Razorpay Checkout
  → SUCCESS: verify signature → mark PAID → save DB → auto-confirm order
  → FAILED: log the attempt with the reason → order stays "pending", customer can retry
  → Webhook Monitoring: a server-to-server backstop that marks orders paid/failed
    even if the customer closes the tab before the browser can confirm it
```

Plus:
- **Admin panel** — Orders tab now shows a Paid/Pending/Failed badge per order, filter
  buttons (All/Paid/Pending/Failed), and an expandable **payment attempt history** per
  order (every attempt, its Razorpay IDs, method, and failure reason if it failed).
- **Invoice/bill** — auto-generated the moment payment clears (not just on manual
  "confirm"), emailed to the customer as a PDF attachment automatically, and
  downloadable as a PDF from **both** the customer's account and the admin panel
  (Invoice / Packing slip / Shipping label / Print-all buttons already existed on the
  backend — I wired them up on the frontend).
- **Retry payment** — if a payment fails or is abandoned, the order is NOT lost. The
  customer sees a "Retry payment" button on the order-success page and in "My Orders".

## Files changed — copy these into your project

All files are in `razorpay-integration/`, mirroring your actual folder structure:

**Backend (`server/`)**
| File | What it is |
|---|---|
| `prisma/schema.prisma` | Full schema — Order gained payment fields, new `PaymentAttempt` model |
| `prisma/migrations/20260910000000_razorpay_payments/migration.sql` | The migration for those changes |
| `src/services/razorpay.js` | **New** — Razorpay SDK wrapper (create order, verify signatures) |
| `src/services/notify.js` | Updated — PDF email attachments, payment-failed alert, fixed a pre-existing bug where customer emails weren't being found |
| `src/controllers/paymentController.js` | **New** — the 4 payment endpoints + webhook handler |
| `src/controllers/orderController.js` | Updated — `markOrderPaid` / `markOrderPaymentFailed` helpers |
| `src/routes/payments.js` | **New** — payment routes |
| `src/app.js` | Updated — wires the webhook (needs raw body) + mounts payment routes |
| `package.json` | Added the `razorpay` npm package |
| `.env.example` | Added `RAZORPAY_WEBHOOK_SECRET` |

**Frontend (`client/`)**
| File | What it is |
|---|---|
| `index.html` | Added Razorpay's checkout.js script |
| `src/api/client.js` | Added payment endpoints + PDF download helper |
| `src/utils/razorpay.js` | **New** — shared checkout-modal logic (used by Checkout, retry buttons) |
| `src/pages/Checkout.jsx` | Rewritten — opens Razorpay Checkout for "Pay online" |
| `src/pages/OrderSuccess.jsx` | Rewritten — payment status, invoice download, retry button |
| `src/pages/Account.jsx` | Updated — "My Orders" shows payment status, retry, invoice download |
| `src/pages/Admin.jsx` | Updated — Orders tab: payment badges, filters, attempt history, document downloads |
| `src/styles-additions-payment-badges.css` | **Paste at the end** of `src/styles/index.css` |
| `src/styles-additions-order-success.css` | **Paste** right after the existing `.success__mark svg { ... }` block in `src/styles/index.css` |

## Setup steps

### 1. Get your Razorpay keys
- Sign up / log in at [dashboard.razorpay.com](https://dashboard.razorpay.com)
- **Settings → API Keys** → generate a key pair (use Test mode keys first)
- Copy `Key ID` and `Key Secret`

### 2. Set environment variables (on Vercel + local `.env`)
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
RAZORPAY_WEBHOOK_SECRET=choose_any_random_string_yourself
```
`RAZORPAY_WEBHOOK_SECRET` isn't given to you by Razorpay — you invent a random
string and put the *same* string in both your env vars and the Razorpay dashboard
(next step).

### 3. Configure the webhook in Razorpay
- **Settings → Webhooks → Add New Webhook**
- URL: `https://yourdomain.com/api/payments/razorpay/webhook`
- Secret: the same string you put in `RAZORPAY_WEBHOOK_SECRET`
- Active events: check **`payment.captured`** and **`payment.failed`**

### 4. Copy in the files, then run the migration
```bash
cd server
npm install                          # pulls in the new `razorpay` package
npx prisma migrate dev               # applies the new schema (or `migrate deploy` in prod)
```

### 5. Paste the two CSS snippets into `client/src/styles/index.css`
(see the table above for exactly where each one goes)

### 6. Push
```bash
git add .
git commit -m "feat: Razorpay payments, admin payment tracking, auto invoices"
git push
```

## How to test (Razorpay test mode)

Once deployed with test keys, place an order with "Pay online" and use Razorpay's
test card: **4111 1111 1111 1111**, any future expiry, any CVV, any OTP. For a
UPI test, use `success@razorpay` as the UPI ID. To test a **failure**, use
`failure@razorpay` as the UPI ID — this lets you see the "Failed" badge and retry
flow working end to end in the admin panel and on the customer's order page.

## Notes
- COD orders are completely unaffected — this only activates for "Pay online".
- Going live: switch to live keys (`rzp_live_...`) once Razorpay approves your KYC.
- The webhook is what makes this reliable even if a customer's browser crashes
  mid-payment — Razorpay's server tells yours directly, independent of the customer's
  device.
