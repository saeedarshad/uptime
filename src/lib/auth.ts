import "server-only";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { Organization, User } from "@prisma/client";
import { prisma } from "./prisma";
import { newSessionToken } from "./ids";

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

/** Guard for authenticated pages/actions; redirects to /login when absent. */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  return auth;
}

/** Guard requiring an owner/admin role (management screens). */
export async function requireManager(): Promise<AuthContext> {
  const auth = await requireAuth();
  if (auth.user.role === "tech") redirect("/dashboard");
  return auth;
}
