import nodemailer from "nodemailer";

/**
 * Optional SMTP email delivery for the authentication server.
 *
 * All configuration comes from server-only env vars. When SMTP_HOST is not
 * set, the mailer is disabled and the caller falls back to logging the reset
 * link (development convenience).
 *
 * Common providers:
 *   - Gmail:            SMTP_HOST=smtp.gmail.com  SMTP_PORT=587  SMTP_USER=<gmail>  SMTP_PASS=<app password>
 *   - Outlook:          SMTP_HOST=smtp.office365.com  SMTP_PORT=587
 *   - Mailgun / Postmark / any relay: use the host/port/credentials they provide.
 *     For port 465 use SMTP_SECURE=true; for 587 leave it unset.
 */

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || "";

const transport = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

export function isMailEnabled() {
  return transport !== null;
}

/**
 * Sends a password-reset email. Returns true if the message was handed off to
 * the transport, false if SMTP is not configured.
 * Throws if SMTP is configured but the message could not be sent.
 */
export async function sendPasswordResetEmail({ to, resetLink }) {
  if (!transport) return false;
  if (!MAIL_FROM) {
    throw new Error("MAIL_FROM must be set when SMTP is configured.");
  }
  const subject = "Reset your Research Hub password";
  const text =
    `You (or someone else) requested a password reset for your Research Hub account.\n\n` +
    `Open this link to choose a new password:\n${resetLink}\n\n` +
    `The link expires in 30 minutes. If you did not request this, you can safely ignore this email.\n`;
  const html =
    `<p>You (or someone else) requested a password reset for your Research Hub account.</p>\n` +
    `<p><a href="${resetLink}">Choose a new password</a> — the link expires in 30 minutes.</p>\n` +
    `<p>If you did not request this, you can safely ignore this email.</p>`;
  await transport.sendMail({ from: MAIL_FROM, to, subject, text, html });
  return true;
}