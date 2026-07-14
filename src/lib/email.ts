import nodemailer from "nodemailer";

/**
 * SMTP email via nodemailer. All config comes from env vars. When SMTP_HOST is
 * unset (e.g. local dev), sending no-ops gracefully and logs to the console so
 * flows never break for lack of a mail server.
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const transport = getTransport();
  const from = process.env.SMTP_FROM ?? "UptimeHQ <no-reply@uptimehq.app>";

  if (!transport) {
    console.info(
      `[email:noop] SMTP unset — would send "${args.subject}" to ${args.to}`,
    );
    return;
  }

  await transport.sendMail({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
}
