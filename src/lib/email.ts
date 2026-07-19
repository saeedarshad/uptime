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

/**
 * Send one email. Never throws: on SMTP failure it logs and returns `false` so
 * a single bad recipient can't abort a batch or break a Server Action. Returns
 * `true` when handed off to the transport (or intentionally no-op'd in dev).
 */
export async function sendEmail(args: SendArgs): Promise<boolean> {
  const transport = getTransport();
  const from = process.env.SMTP_FROM ?? "UptimeHQ <no-reply@uptimehq.app>";

  if (!transport) {
    console.info(
      `[email:noop] SMTP unset — would send "${args.subject}" to ${args.to}`,
    );
    return true;
  }

  try {
    await transport.sendMail({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    return true;
  } catch (err) {
    console.error(
      `[email:error] failed to send "${args.subject}" to ${args.to}:`,
      err,
    );
    return false;
  }
}

/**
 * Fan a single message out to many recipients, isolating failures per-address.
 * Returns how many were handed off successfully.
 */
export async function sendEmailToMany(
  recipients: string[],
  message: Omit<SendArgs, "to">,
): Promise<number> {
  const results = await Promise.all(
    recipients.map((to) => sendEmail({ to, ...message })),
  );
  return results.filter(Boolean).length;
}
