import { appUrl } from "./qr";
import { formatMoney, formatDate } from "./format";

/**
 * Shared transactional-email rendering. One `renderEmailLayout` wrapper (the
 * card + orange CTA button styling shared with the monthly report) plus a
 * builder per message type, each returning `{ subject, html, text }` so callers
 * stay declarative and `sendEmail` gets a plain-text fallback.
 */

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const BRAND = "#E1622F";
const INK = "#242B33";

interface LayoutArgs {
  heading: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
}

/** Wrap body HTML in the shared branded card. */
export function renderEmailLayout({ heading, bodyHtml, cta }: LayoutArgs): string {
  const button = cta
    ? `<p style="margin:24px 0 8px">
         <a href="${cta.url}" style="background:${BRAND};color:#fff;padding:11px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">${cta.label}</a>
       </p>`
    : "";
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:${INK}">
    <h1 style="font-size:18px;margin:0 0 4px">${heading}</h1>
    ${bodyHtml}
    ${button}
    <p style="color:#9aa4ad;font-size:12px;margin-top:28px">UptimeHQ · equipment maintenance made simple</p>
  </div>`;
}

/** Collapse an HTML fragment to a rough plain-text fallback. */
function toText(...lines: string[]): string {
  return lines.join("\n\n");
}

export function verifyEmail(name: string, url: string): EmailContent {
  return {
    subject: "Confirm your email · UptimeHQ",
    html: renderEmailLayout({
      heading: `Welcome, ${name}`,
      bodyHtml: `<p style="color:#555">Confirm your email address to secure your UptimeHQ account. This link expires in 24 hours.</p>`,
      cta: { label: "Confirm email", url },
    }),
    text: toText(
      `Welcome, ${name}`,
      "Confirm your email address to secure your UptimeHQ account. This link expires in 24 hours:",
      url,
    ),
  };
}

export function passwordReset(name: string, url: string): EmailContent {
  return {
    subject: "Reset your password · UptimeHQ",
    html: renderEmailLayout({
      heading: "Reset your password",
      bodyHtml: `<p style="color:#555">Hi ${name}, we received a request to reset your UptimeHQ password. This link expires in 1 hour. If you didn't ask for this, you can safely ignore this email.</p>`,
      cta: { label: "Choose a new password", url },
    }),
    text: toText(
      `Hi ${name},`,
      "We received a request to reset your UptimeHQ password. This link expires in 1 hour:",
      url,
      "If you didn't ask for this, you can safely ignore this email.",
    ),
  };
}

export function inviteEmail(
  invitedName: string,
  orgName: string,
  url: string,
): EmailContent {
  return {
    subject: `You've been invited to ${orgName} on UptimeHQ`,
    html: renderEmailLayout({
      heading: `Join ${orgName} on UptimeHQ`,
      bodyHtml: `<p style="color:#555">Hi ${invitedName}, you've been invited to help manage equipment maintenance at <strong>${orgName}</strong>. Set a password to get started.</p>`,
      cta: { label: "Accept invite", url },
    }),
    text: toText(
      `Hi ${invitedName},`,
      `You've been invited to help manage equipment maintenance at ${orgName}. Set a password to get started:`,
      url,
    ),
  };
}

export function expiryReminder(
  orgName: string,
  endsAt: Date,
  timezone: string,
  daysRemaining: number,
  onTrial: boolean,
): EmailContent {
  const what = onTrial ? "free trial" : "subscription";
  const when =
    daysRemaining <= 1 ? "tomorrow" : `in ${daysRemaining} days`;
  return {
    subject: `${orgName} · your UptimeHQ ${what} ends ${when}`,
    html: renderEmailLayout({
      heading: `Your ${what} ends ${when}`,
      bodyHtml: `<p style="color:#555">Access for <strong>${orgName}</strong> lapses on ${formatDate(endsAt, timezone)}. ${onTrial ? "Add a subscription" : "Renew"} to keep your dashboard, insights, and QR reporting active.</p>`,
      cta: { label: "Manage subscription", url: `${appUrl()}/settings` },
    }),
    text: toText(
      `Your UptimeHQ ${what} for ${orgName} ends ${when} (${formatDate(endsAt, timezone)}).`,
      `${onTrial ? "Add a subscription" : "Renew"} to keep access: ${appUrl()}/settings`,
    ),
  };
}

export function renewalConfirmation(
  orgName: string,
  amountCents: number,
  periodEnd: Date,
  timezone: string,
): EmailContent {
  return {
    subject: `${orgName} · payment received`,
    html: renderEmailLayout({
      heading: "Payment received — thank you",
      bodyHtml: `<p style="color:#555">We've recorded a payment of <strong>${formatMoney(amountCents)}</strong> for <strong>${orgName}</strong>. Your subscription is active through ${formatDate(periodEnd, timezone)}.</p>`,
      cta: { label: "Open your dashboard", url: `${appUrl()}/dashboard` },
    }),
    text: toText(
      `Payment received — thank you.`,
      `We've recorded a payment of ${formatMoney(amountCents)} for ${orgName}. Your subscription is active through ${formatDate(periodEnd, timezone)}.`,
    ),
  };
}
