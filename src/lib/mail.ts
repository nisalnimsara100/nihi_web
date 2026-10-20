import "server-only";
import nodemailer from "nodemailer";

/**
 * Sends email over SMTP. Gmail works out of the box: set SMTP_USER to the Gmail address and
 * SMTP_PASSWORD to an app password (Google Account > Security > 2-Step Verification > App passwords;
 * the normal Gmail password is rejected). Any other SMTP service works by also setting SMTP_HOST.
 * Without SMTP_USER and SMTP_PASSWORD nothing is sent and the app falls back to copying the link.
 */
export function mailConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

export async function sendMail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) {
    throw new Error("Email is not set up");
  }
  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transport.sendMail({ from: process.env.MAIL_FROM ?? `NiHi <${user}>`, to, subject, text, html });
}
