import { customAlphabet } from "nanoid";

// Unguessable, URL-safe, lowercase+digits (no ambiguous chars) 10-char slug
// for public asset QR URLs.
const alphabet = "23456789abcdefghijkmnpqrstuvwxyz";
const nano = customAlphabet(alphabet, 10);

export function newPublicId(): string {
  return nano();
}

// Opaque session token.
const tokenAlphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const tokenNano = customAlphabet(tokenAlphabet, 48);

export function newSessionToken(): string {
  return tokenNano();
}

// Invite token.
export function newInviteToken(): string {
  return tokenNano();
}

// Single-use email-verification / password-reset token (hashed at rest).
export function newAuthToken(): string {
  return tokenNano();
}
