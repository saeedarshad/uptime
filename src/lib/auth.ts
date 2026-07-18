import "server-only";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Organization, User } from "@prisma/client";
import { prisma } from "./prisma";
import { newSessionToken } from "./ids";
import { computeSubscription } from "./subscription";

const SESSION_COOKIE = "uptime_session";
const SESSION_TTL_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// The cookie holds the raw token; only its hash is stored at rest.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }
  cookies().delete(SESSION_COOKIE);
}

export interface AuthContext {
  user: User;
  org: Organization;
}

/** Returns the current user + org, or null if not authenticated. */
export async function getAuth(): Promise<AuthContext | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { org: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  return { user: session.user, org: session.user.org };
}

/**
 * Guard for authenticated pages/actions. Redirects to `/login` when there is no
 * session, and to `/locked` when the org's trial/subscription has lapsed. Since
 * `requireManager()` and virtually every page/action funnel through here, this
 * is the single choke point that enforces the paywall for both reads and
 * writes. Screens that must render while locked (the `/locked` page and logout)
 * use `getAuth()` directly to avoid a redirect loop.
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  // Platform operators bypass the tenant paywall entirely.
  if (auth.user.isAdmin) return auth;
  const { accessAllowed } = computeSubscription(auth.org);
  if (!accessAllowed) redirect("/locked");
  return auth;
}

/** Guard requiring an owner/admin role (management screens). */
export async function requireManager(): Promise<AuthContext> {
  const auth = await requireAuth();
  if (auth.user.role === "tech") redirect("/dashboard");
  return auth;
}

/**
 * Guard for the platform operator console (`/admin`). Uses `getAuth()` directly
 * (not `requireAuth()`) so it is never diverted by the tenant paywall.
 * Non-admins are bounced to their dashboard; signed-out users to login.
 */
export async function requireAdmin(): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  if (!auth.user.isAdmin) redirect("/dashboard");
  return auth;
}
