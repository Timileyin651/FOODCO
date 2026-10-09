/**
 * Outbound mail. The app has no npm registry access, so nodemailer is only
 * used if it happens to be installed; otherwise the caller falls back to
 * logging the link in development (see authController).
 */

function loadTransport() {
  if (!process.env.SMTP_HOST) return null;
  let nodemailer = null;
  try {
    nodemailer = require('nodemailer');
  } catch (err) {
    nodemailer = null;
  }
  if (!nodemailer) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function sendMail({ to, subject, text }) {
  const transport = loadTransport();
  if (!transport) {
    return { sent: false, reason: 'not-configured' };
  }
  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || 'FoodCo <no-reply@foodco.local>',
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error('Mail send failed:', err.message);
    return { sent: false, reason: 'error', error: err };
  }
}

module.exports = { sendMail };
