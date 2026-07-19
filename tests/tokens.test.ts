import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createAuthToken, consumeAuthToken } from "../src/lib/tokens";

// Exercises the single-use auth-token lifecycle against the DB: happy path,
// expiry, double-consume, and wrong-type rejection.

const SLUG = "token-test-org";
const EMAIL = "token-test-user@example.com";
let userId = "";

beforeAll(async () => {
  const existing = await prisma.organization.findUnique({ where: { slug: SLUG } });
  if (existing) await prisma.organization.delete({ where: { id: existing.id } });
  const org = await prisma.organization.create({
    data: { name: "Token Test Org", slug: SLUG },
  });
  const user = await prisma.user.create({
    data: {
      orgId: org.id,
      email: EMAIL,
      name: "Token Tester",
      passwordHash: "x",
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.organization
    .deleteMany({ where: { slug: SLUG } })
    .catch(() => undefined);
  await prisma.$disconnect();
});

describe("auth tokens", () => {
  it("mints a token that consumes exactly once", async () => {
    const raw = await createAuthToken(userId, "password_reset");
    expect(await consumeAuthToken(raw, "password_reset")).toBe(userId);
    // Second attempt fails — single use.
    expect(await consumeAuthToken(raw, "password_reset")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const raw = await createAuthToken(userId, "email_verify", -1000);
    expect(await consumeAuthToken(raw, "email_verify")).toBeNull();
  });

  it("rejects a token used with the wrong type", async () => {
    const raw = await createAuthToken(userId, "email_verify");
    expect(await consumeAuthToken(raw, "password_reset")).toBeNull();
    // Correct type still works afterward (wrong-type check didn't consume it).
    expect(await consumeAuthToken(raw, "email_verify")).toBe(userId);
  });

  it("invalidates older unconsumed tokens of the same type", async () => {
    const first = await createAuthToken(userId, "password_reset");
    const second = await createAuthToken(userId, "password_reset");
    expect(await consumeAuthToken(first, "password_reset")).toBeNull();
    expect(await consumeAuthToken(second, "password_reset")).toBe(userId);
  });

  it("rejects an unknown token", async () => {
    expect(await consumeAuthToken("does-not-exist", "email_verify")).toBeNull();
  });
});
