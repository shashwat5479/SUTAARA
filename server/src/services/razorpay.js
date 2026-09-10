// Razorpay integration — order creation, signature verification, and
// webhook signature verification. All three are pure crypto/HTTP calls
// against Razorpay's API; no state is kept here (state lives on the Order
// and PaymentAttempt rows, updated by paymentController.js).
//
// Required env vars:
//   RAZORPAY_KEY_ID        — from Razorpay Dashboard > Settings > API Keys
//   RAZORPAY_KEY_SECRET    — same page (keep this one server-side only)
//   RAZORPAY_WEBHOOK_SECRET — set when you add the webhook URL in the
//                             Razorpay dashboard (Settings > Webhooks). This
//                             is a secret YOU choose there, not generated —
//                             put the same string in both places.
import Razorpay from 'razorpay';
import crypto from 'crypto';

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

let client = null;
function getClient() {
  if (!KEY_ID || !KEY_SECRET) {
    throw Object.assign(
      new Error('Online payments are not configured yet — RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing'),
      { status: 503 }
    );
  }
  if (!client) client = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  return client;
}

export const isRazorpayConfigured = () => Boolean(KEY_ID && KEY_SECRET);
export const razorpayKeyId = () => KEY_ID; // safe to expose to the client — it's the public half

// Creates a Razorpay Order for the given amount (in paise) tied to our
// order's human-facing number as the receipt, so it's traceable from the
// Razorpay dashboard back to a Sutaara order without cross-referencing IDs.
export async function createRazorpayOrder({ amountPaise, receipt, notes }) {
  const rp = getClient();
  return rp.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes,
    payment_capture: 1, // auto-capture — no separate "capture" step to manage
  });
}

// Verifies the signature Razorpay's Checkout returns to the browser after a
// successful payment: HMAC-SHA256 of "order_id|payment_id" using the key
// secret. This is the step that actually proves the payment happened — the
// browser can be tampered with, this signature can't be forged without the
// secret.
export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!KEY_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature || ''));
  } catch {
    return false; // length mismatch etc. — definitely not a match
  }
}

// Verifies the X-Razorpay-Signature header on incoming webhooks: HMAC-SHA256
// of the raw request body using the webhook secret (different secret from
// the payment signature above). rawBody MUST be the exact bytes Razorpay
// signed — a re-serialized JSON object will not match.
export function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!WEBHOOK_SECRET || !signatureHeader) return false;
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}
