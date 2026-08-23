import nodemailer from 'nodemailer';

// SMTP is optional. If it isn't configured we fall back to logging the code to
// the server console — that keeps local development working without an email
// account, but it is NOT safe for production: anyone reading the logs could
// verify someone else's address. isConfigured() lets the controller refuse to
// send in production rather than silently degrading to the console.
const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT || 587);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const FROM = process.env.MAIL_FROM || 'Sutaara <no-reply@sutaara.in>';

export const isConfigured = () => Boolean(HOST && USER && PASS);

let transporter = null;
function getTransporter() {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: HOST,
      port: PORT,
      secure: PORT === 465, // 465 is implicit TLS; 587 upgrades via STARTTLS
      auth: { user: USER, pass: PASS },
    });
  }
  return transporter;
}

function otpTemplate(code, name) {
  const greeting = name ? `Hello ${name},` : 'Hello,';
  return {
    subject: `${code} is your Sutaara verification code`,
    text: `${greeting}

Your Sutaara verification code is ${code}.

It expires in 10 minutes. If you didn't try to create an account, you can
ignore this email — nothing has been created.

— Sutaara`,
    html: `
<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2b211c">
  <p style="letter-spacing:.28em;font-size:12px;text-transform:uppercase;color:#a98545;margin:0 0 24px">Sutaara</p>
  <p style="margin:0 0 16px">${greeting}</p>
  <p style="margin:0 0 24px">Enter this code to verify your email address:</p>
  <p style="font-size:34px;letter-spacing:.32em;font-weight:600;margin:0 0 24px;color:#7a1f2b">${code}</p>
  <p style="margin:0 0 8px;font-size:14px;color:#6b5d55">This code expires in 10 minutes.</p>
  <p style="margin:0;font-size:14px;color:#6b5d55">
    If you didn't try to create an account, you can ignore this email — nothing has been created.
  </p>
</div>`,
  };
}

export async function sendOtpEmail(to, code, name) {
  const tx = getTransporter();
  const { subject, text, html } = otpTemplate(code, name);

  if (!tx) {
    // Dev fallback — make it obvious in the logs that this is not a real send.
    console.warn(
      `[mailer] SMTP not configured. Verification code for ${to}: ${code} ` +
        '(set SMTP_HOST/SMTP_USER/SMTP_PASS to send real email)'
    );
    return { delivered: false };
  }

  await tx.sendMail({ from: FROM, to, subject, text, html });
  return { delivered: true };
}
