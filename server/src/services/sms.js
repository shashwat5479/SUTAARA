// General-purpose SMS via MSG91's Send SMS (Flow) API — used for order and
// appointment confirmations alongside email. This is NOT the OTP/auth flow
// (that was removed); it's a one-way transactional notification, same idea
// as mailer.js but for SMS.
//
// Pluggable exactly like mailer.js: without SMS_API_KEY/SMS_TEMPLATE_ID
// configured, this logs to the console instead of sending — safe for local
// dev, and a notification failure here must never break placing an order
// or booking an appointment (every call site already wraps this in
// .catch(() => {})).
const API_KEY = process.env.SMS_API_KEY || '';
const SENDER_ID = process.env.SMS_SENDER_ID || 'SUTARA';
// MSG91 requires a DLT-registered template for India routes (mandatory by
// law for promotional/transactional SMS to Indian numbers). Create one at
// control.msg91.com > SMS > Templates with a single {{var}} placeholder for
// the message body, and put its template ID here.
const TEMPLATE_ID = process.env.SMS_TEMPLATE_ID || '';

export const isConfigured = () => Boolean(API_KEY && TEMPLATE_ID);

function normalizePhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits; // MSG91 wants the country code prefixed
}

// `body` is the free-text message — only used for the console fallback and
// as the template's {{var}} value. The template's fixed wording was
// already DLT-approved and can't be freely rewritten around it.
export async function sendSms(phone, body) {
  const to = normalizePhone(phone);
  if (!to || to.length < 12) return { delivered: false }; // no usable number — silently skip, not an error

  if (!isConfigured()) {
    console.warn(`[sms] SMS_API_KEY/SMS_TEMPLATE_ID not configured. Would text +${to}: ${body}`);
    return { delivered: false };
  }

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authkey: API_KEY },
      body: JSON.stringify({
        template_id: TEMPLATE_ID,
        sender: SENDER_ID,
        short_url: '0',
        mobiles: to,
        var: body,
      }),
    });
    if (!res.ok) {
      console.error('[sms] MSG91 send failed:', res.status, await res.text().catch(() => ''));
      return { delivered: false };
    }
    return { delivered: true };
  } catch (err) {
    console.error('[sms] send error:', err.message);
    return { delivered: false };
  }
}
