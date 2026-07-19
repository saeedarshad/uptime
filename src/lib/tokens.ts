import { createHash } from "crypto";
import type { AuthTokenType } from "@prisma/client";
import { prisma } from "./prisma";
import { newAuthToken } from "./ids";

/**
 * Single-use auth tokens for email verification and password reset. The raw
 * token travels in the emailed URL; only its sha256 is persisted (same
 * hash-at-rest approach as session tokens in `auth.ts`).
 */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const AUTH_TOKEN_TTL = {
  email_verify: 24 * 60 * 60 * 1000, // 24h
  password_reset: 60 * 60 * 1000, // 1h
} as const satisfies Record<AuthTokenType, number>;

/**
 * Mint a token of the given type for a user and return the RAW token (to embed
 * in an email link). Only the hash is stored. Any prior unconsumed tokens of the
 * same type are invalidated so a fresh link always supersedes older ones.
 */
export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlMs: number = AUTH_TOKEN_TTL[type],
): Promise<string> {
  const raw = newAuthToken();
  const expiresAt = new Date(Date.now() + ttlMs);
  await prisma.$transaction([
    prisma.authToken.updateMany({
      where: { userId, type, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.authToken.create({
      data: { userId, type, tokenHash: hashToken(raw), expiresAt },
    }),
  ]);
  return raw;
}

/**
 * Validate and consume a raw token. Returns the owning userId on success, or
 * null when the token is unknown, of the wrong type, expired, or already used.
 * Consumption is atomic (`updateMany` on the unconsumed row) so a token can
 * never be redeemed twice.
 */
export async function consumeAuthToken(
  rawToken: string,
  type: AuthTokenType,
): Promise<string | null> {
  const record = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (
    !record ||
    record.type !== type ||
    record.consumedAt !== null ||
    record.expiresAt.getTime() <= Date.now()
  ) {
    return null;
  }
  const consumed = await prisma.authToken.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  // Lost the race (a concurrent request consumed it first).
  if (consumed.count === 0) return null;
  return record.userId;
}
