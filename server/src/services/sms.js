// SMS delivery for phone OTP sign-in. Pluggable like mailer.js/shipping.js —
// without SMS_API_KEY configured, codes are logged to the server console
// instead of texted (fine locally; the controller refuses to send in
// production so nobody "verifies" a phone number they don't own).
//
// Default provider is MSG91 (widely used for Indian DLT-registered SMS
// routes). Swap the fetch call below for Twilio/any other provider if
// you use a different one — the rest of the auth flow doesn't care how
// the code was delivered.
const API_KEY = process.env.SMS_API_KEY;
const SENDER_ID = process.env.SMS_SENDER_ID || 'SUTARA';
// MSG91's OTP-via-template route needs a DLT-approved template containing
// a `##OTP##` placeholder — see https://docs.msg91.com/p/tf9GTextN/e/i05xZQMSHY
const TEMPLATE_ID = process.env.SMS_TEMPLATE_ID;

export const isConfigured = () => Boolean(API_KEY);

export async function sendOtpSms(phone, code) {
  if (!isConfigured()) {
    console.warn(
      `[sms] SMS_API_KEY not configured. OTP for ${phone}: ${code} ` +
        '(set SMS_API_KEY/SMS_SENDER_ID/SMS_TEMPLATE_ID to send a real text)'
    );
    return { delivered: false };
  }

  const res = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: API_KEY },
    body: JSON.stringify({
      template_id: TEMPLATE_ID,
      mobile: phone.startsWith('91') ? phone : `91${phone.replace(/\D/g, '')}`,
      otp: code,
      sender: SENDER_ID,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`SMS provider error (${res.status}): ${detail || 'send failed'}`);
  }
  return { delivered: true };
}
