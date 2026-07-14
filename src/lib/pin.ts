import "server-only";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import type { Organization } from "@prisma/client";

// Techs enter the shop PIN once per shift; a signed cookie remembers it for 12h
// so subsequent scans don't re-prompt.
const TTL_HOURS = 12;

function cookieName(orgId: string): string {
  return `pin_${orgId}`;
}

function token(orgId: string, pin: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev-secret";
  return createHash("sha256").update(`${orgId}:${pin}:${secret}`).digest("hex");
}

/** True when the org has no PIN, or the visitor already entered it recently. */
export function isPinSatisfied(org: Organization): boolean {
  if (!org.pinCode) return true;
  const cookie = cookies().get(cookieName(org.id))?.value;
  return cookie === token(org.id, org.pinCode);
}

/** Validate a submitted PIN and, if correct, drop the 12h cookie. */
export function tryEnterPin(org: Organization, submitted: string): boolean {
  if (!org.pinCode || submitted.trim() !== org.pinCode) return false;
  cookies().set(cookieName(org.id), token(org.id, org.pinCode), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + TTL_HOURS * 3_600_000),
  });
  return true;
}
