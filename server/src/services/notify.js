// Notification service — sends order emails via Resend, and (later) WhatsApp.
// Reads credentials from env so no secret ever lives in code:
//   RESEND_API_KEY   — your Resend API key
//   MAIL_FROM        — verified "from" address (e.g. "Sutaara <orders@yourdomain.com>")
//                      For a demo without a domain, use "onboarding@resend.dev"
//                      (Resend only delivers test-sender mail to your own verified address).
//
// All functions fail soft: if a key is missing or the send errors, we log and
// carry on — a notification failure must never break placing/updating an order.
import { prisma } from '../config/db.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || 'Sutaara <onboarding@resend.dev>';

// Human-friendly copy for each order status.
const STATUS_COPY = {
  pending: { subject: 'We’ve received your order', line: 'Thank you for your order! We’ve received it and will confirm shortly.' },
  confirmed: { subject: 'Your order is confirmed', line: 'Good news — your order is confirmed and being prepared.' },
  processing: { subject: 'Your order is being prepared', line: 'Your order is now being carefully prepared.' },
  packed: { subject: 'Your order is packed', line: 'Your order has been packed and is ready to ship.' },
  shipped: { subject: 'Your order has shipped', line: 'Your order is on its way!' },
  out_for_delivery: { subject: 'Out for delivery', line: 'Your order is out for delivery and will reach you soon.' },
  delivered: { subject: 'Your order has been delivered', line: 'Your order has been delivered. We hope you love it!' },
  cancelled: { subject: 'Your order was cancelled', line: 'Your order has been cancelled. If this was a mistake, please contact us.' },
  return_requested: { subject: 'Return requested', line: 'We’ve received your return request and will be in touch.' },
  return_approved: { subject: 'Return approved', line: 'Your return has been approved. We’ll guide you through the next steps.' },
  refund_initiated: { subject: 'Refund initiated', line: 'Your refund has been initiated.' },
  refunded: { subject: 'Refund complete', line: 'Your refund has been processed to your original payment method.' },
};

async function getSettings() {
  try {
    let s = await prisma.notificationSettings.findFirst();
    if (!s) s = await prisma.notificationSettings.create({ data: {} });
    return s;
  } catch {
    return { alertEmail: process.env.ALERT_EMAIL || 'shashwat9252@gmail.com', alertWhatsApp: '9569659272', emailEnabled: true };
  }
}

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('[notify] RESEND_API_KEY not set — skipping email:', subject);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[notify] email send failed:', res.status, body);
    }
  } catch (err) {
    console.error('[notify] email error:', err.message);
  }
}

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function orderItemsHtml(order) {
  const rows = (order.items || [])
    .map((i) => `<tr><td style="padding:4px 8px">${i.name}</td><td style="padding:4px 8px">×${i.qty}</td><td style="padding:4px 8px">${money(i.price)}</td></tr>`)
    .join('');
  return `<table style="border-collapse:collapse;margin:12px 0">${rows}</table>`;
}

// Sent to the customer when the order status changes (and on placement).
export async function notifyCustomerStatus(order, status) {
  const copy = STATUS_COPY[status];
  if (!copy) return;
  const email = order.email || order.user?.email;
  if (!email) return;

  const track = order.trackingUrl ? `<p>Track your parcel: <a href="${order.trackingUrl}">${order.trackingUrl}</a></p>` : '';
  const html = `
    <div style="font-family:Georgia,serif;color:#2b211c;max-width:520px">
      <h2 style="color:#8a1f26">Sutaara</h2>
      <p>Hi ${order.name || 'there'},</p>
      <p>${copy.line}</p>
      <p><strong>Order #${(order.id || '').slice(0, 8)}</strong> · ${money(order.totalPrice)}</p>
      ${orderItemsHtml(order)}
      ${track}
      <p style="color:#5a4d44;font-size:13px">Questions? Reply to this email or WhatsApp us at 9569659272.</p>
      <p style="color:#5a4d44;font-size:13px">— Team Sutaara, Lucknow</p>
    </div>`;
  await sendEmail({ to: email, subject: `${copy.subject} · Sutaara`, html });
}

// Sent to the store owner when a new order is placed.
export async function notifyOwnerNewOrder(order) {
  const s = await getSettings();
  if (!s.emailEnabled) return;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#2b211c;max-width:520px">
      <h2>New order received</h2>
      <p><strong>Order #${(order.id || '').slice(0, 8)}</strong> · ${money(order.totalPrice)}</p>
      <p>Customer: ${order.name || '—'} (${order.email || '—'}, ${order.phone || '—'})</p>
      <p>Ship to: ${order.address1 || ''}, ${order.city || ''}, ${order.state || ''} ${order.pincode || ''}</p>
      ${orderItemsHtml(order)}
      <p>Payment: ${order.paymentMethod || '—'}</p>
    </div>`;
  await sendEmail({ to: s.alertEmail, subject: `New order · ${money(order.totalPrice)} · Sutaara`, html });
  // WhatsApp owner alert will be added here in Phase 2 (uses s.alertWhatsApp).
}
