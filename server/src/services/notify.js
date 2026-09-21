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
import { sendSms } from './sms.js';

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

async function sendEmail({ to, subject, html, attachments }) {
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
      body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, html, attachments }),
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

// ----- Studio appointment emails -----

const APPT_STATUS_COPY = {
  requested: {
    subject: 'We’ve received your appointment request',
    line: 'Thank you for booking with Sutaara Studio — we’ve received your request and will confirm shortly.',
  },
  confirmed: {
    subject: 'Your studio appointment is confirmed',
    line: 'Good news — your studio appointment is confirmed. See you then!',
  },
  completed: {
    subject: 'Thank you for visiting Sutaara Studio',
    line: 'Thank you for visiting us at the studio — we hope you loved it.',
  },
  cancelled: {
    subject: 'Your studio appointment was cancelled',
    line: 'Your studio appointment has been cancelled. If this was a mistake, please contact us.',
  },
};

function appointmentDetailsHtml(appt) {
  const dateStr = new Date(appt.preferredDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `
    <p style="margin:4px 0"><strong>Service:</strong> ${appt.service}</p>
    <p style="margin:4px 0"><strong>Date:</strong> ${dateStr}</p>
    <p style="margin:4px 0"><strong>Time:</strong> ${appt.preferredTime}</p>`;
}

// Sent to the customer right when they submit a booking (status
// "requested"), and again whenever an admin changes its status.
export async function notifyCustomerAppointment(appointment, status) {
  const copy = APPT_STATUS_COPY[status];
  if (!copy) return;
  if (appointment.email) {
    const html = `
      <div style="font-family:Georgia,serif;color:#2b211c;max-width:520px">
        <h2 style="color:#8a1f26">Sutaara Studio</h2>
        <p>Hi ${appointment.name || 'there'},</p>
        <p>${copy.line}</p>
        ${appointmentDetailsHtml(appointment)}
        <p style="color:#5a4d44;font-size:13px">Questions? Reply to this email or WhatsApp us at 9569659272.</p>
        <p style="color:#5a4d44;font-size:13px">— Team Sutaara, Lucknow</p>
      </div>`;
    await sendEmail({ to: appointment.email, subject: `${copy.subject} · Sutaara`, html });
  }
  if (appointment.phone) {
    const dateStr = new Date(appointment.preferredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    await sendSms(appointment.phone, `Sutaara Studio: ${copy.line} ${appointment.service}, ${dateStr} at ${appointment.preferredTime}.`).catch(() => {});
  }
}

// Sent to the store owner (admin alert addresses) the moment a new
// appointment is requested, so it doesn't rely on someone checking the
// admin panel proactively.
export async function notifyOwnerNewAppointment(appointment) {
  const s = await getSettings();
  if (!s.emailEnabled) return;
  const dateStr = new Date(appointment.preferredDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const html = `
    <div style="font-family:Arial,sans-serif;color:#2b211c;max-width:520px">
      <h2>New studio appointment requested</h2>
      <p><strong>${appointment.service}</strong> — ${dateStr} at ${appointment.preferredTime}</p>
      <p>Customer: ${appointment.name} (${appointment.email}, ${appointment.phone})</p>
      ${appointment.notes ? `<p>Notes: ${appointment.notes}</p>` : ''}
    </div>`;
  const recipients = [s.alertEmail1, s.alertEmail2, s.alertEmail3].filter(Boolean);
  await Promise.all(
    recipients.map((to) => sendEmail({ to, subject: 'New appointment request · Sutaara', html }))
  );
}

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
  const email = order.user?.email;
  const track = order.trackingUrl ? `<p>Track your parcel: <a href="${order.trackingUrl}">${order.trackingUrl}</a></p>` : '';
  if (email) {
    const html = `
      <div style="font-family:Georgia,serif;color:#2b211c;max-width:520px">
        <h2 style="color:#8a1f26">Sutaara</h2>
        <p>Hi ${order.fullName || order.user?.name || 'there'},</p>
        <p>${copy.line}</p>
        <p><strong>Order ${order.orderNumber || ('#' + (order.id || '').slice(0, 8))}</strong> · ${money(order.totalPrice)}</p>
        ${orderItemsHtml(order)}
        ${track}
        <p style="color:#5a4d44;font-size:13px">Questions? Reply to this email or WhatsApp us at 9569659272.</p>
        <p style="color:#5a4d44;font-size:13px">— Team Sutaara, Lucknow</p>
      </div>`;
    await sendEmail({ to: email, subject: `${copy.subject} · Sutaara`, html });
  }
  if (order.phone) {
    const orderNo = order.orderNumber || ('#' + (order.id || '').slice(0, 8));
    const smsLine = `Sutaara: ${copy.line} Order ${orderNo}, ${money(order.totalPrice)}.${order.trackingUrl ? ` Track: ${order.trackingUrl}` : ''}`;
    await sendSms(order.phone, smsLine).catch(() => {});
  }
}

// Sent to the store owner when a new order is placed.
export async function notifyOwnerNewOrder(order) {
  const s = await getSettings();
  if (!s.emailEnabled) return;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#2b211c;max-width:520px">
      <h2>New order received</h2>
      <p><strong>Order ${order.orderNumber || ('#' + (order.id || '').slice(0, 8))}</strong> · ${money(order.totalPrice)}</p>
      <p>Customer: ${order.fullName || order.user?.name || '—'} (${order.user?.email || '—'}, ${order.phone || '—'})</p>
      <p>Ship to: ${[order.line1, order.line2].filter(Boolean).join(', ')}, ${order.city || ''}, ${order.state || ''} ${order.pincode || ''}</p>
      ${orderItemsHtml(order)}
      <p>Payment: ${order.paymentMethod || '—'}${order.paymentMethod === 'online' ? (order.isPaid ? ' (paid)' : ' (awaiting payment)') : ''}</p>
    </div>`;
  const recipients = [s.alertEmail1, s.alertEmail2, s.alertEmail3].filter(Boolean);
  await Promise.all(recipients.map((to) => sendEmail({ to, subject: `New order · ${money(order.totalPrice)} · Sutaara`, html })));
  if (s.alertWhatsApp) {
    await sendSms(s.alertWhatsApp, `Sutaara: New order ${order.orderNumber || ''} for ${money(order.totalPrice)} from ${order.fullName || 'a customer'}.`).catch(() => {});
  }
}

// Sent to the store owner the moment a Razorpay payment attempt fails (or
// the checkout is abandoned) — this is what makes "which payment failed"
// visible without having to go dig through the admin panel proactively.
export async function notifyOwnerPaymentFailed(order, reason) {
  const s = await getSettings();
  if (!s.emailEnabled) return;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#2b211c;max-width:520px">
      <h2 style="color:#a33">Payment failed</h2>
      <p><strong>Order ${order.orderNumber || order.id}</strong> · ${money(order.totalPrice)}</p>
      <p>Customer: ${order.fullName || '—'} (${order.phone || '—'})</p>
      <p>Reason: ${reason || 'Not provided by Razorpay'}</p>
      <p style="color:#5a4d44;font-size:13px">The order is still open — the customer can retry payment from their account.</p>
    </div>`;
  const recipients = [s.alertEmail1, s.alertEmail2, s.alertEmail3].filter(Boolean);
  await Promise.all(recipients.map((to) => sendEmail({ to, subject: `Payment failed · ${order.orderNumber || ''} · Sutaara`, html })));
}

// Sent to the customer right after a successful payment, with the invoice
// PDF attached so they have a bill in hand without needing to log in.
export async function sendInvoiceEmail(order) {
  const email = order.user?.email;
  if (!email) return;
  const { buildInvoicePDF } = await import('./documents.js');
  const pdf = await buildInvoicePDF(order);
  const html = `
    <div style="font-family:Georgia,serif;color:#2b211c;max-width:520px">
      <h2 style="color:#8a1f26">Sutaara</h2>
      <p>Hi ${order.fullName || 'there'},</p>
      <p>Thank you for your payment — here's your invoice for order <strong>${order.orderNumber}</strong>.</p>
      <p><strong>${money(order.totalPrice)}</strong> paid successfully.</p>
      ${orderItemsHtml(order)}
      <p style="color:#5a4d44;font-size:13px">Your invoice is attached as a PDF. You can also download it anytime from your account.</p>
      <p style="color:#5a4d44;font-size:13px">— Team Sutaara, Lucknow</p>
    </div>`;
  await sendEmail({
    to: email,
    subject: `Your invoice ${order.invoiceNumber} · Sutaara`,
    html,
    attachments: [{ filename: `${order.orderNumber}-invoice.pdf`, content: pdf.toString('base64') }],
  });
}
