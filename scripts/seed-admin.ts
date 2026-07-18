/**
 * Create or reset the platform operator (admin) account. The admin is a normal
 * User with `isAdmin = true` that signs in through the regular /login and is
 * then routed to /admin. Prod deploys already bootstrap this via migration; use
 * this script locally to (re)create it or reset the password.
 *
 * Credentials default to admin@uptimehq.app / admin9898, overridable with
 * ADMIN_EMAIL / ADMIN_PASSWORD (optional ADMIN_NAME).
 *
 * Run with:  npm run seed:admin
 * Idempotent — re-running updates the password/name for that email.
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const PLATFORM_ORG_ID = "org_platform_admin";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@uptimehq.app")
    .toLowerCase()
    .trim();
  const password = process.env.ADMIN_PASSWORD ?? "admin9898";
  const name = process.env.ADMIN_NAME ?? "Platform Admin";

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  await prisma.organization.upsert({
    where: { id: PLATFORM_ORG_ID },
    update: {},
    create: {
      id: PLATFORM_ORG_ID,
      name: "UptimeHQ Platform",
      slug: "uptimehq-platform",
      plan: "active",
    },
  });

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, isAdmin: true },
    create: {
      email,
      passwordHash,
      name,
      role: "owner",
      isAdmin: true,
      orgId: PLATFORM_ORG_ID,
    },
  });
  console.log(`[seed:admin] ready — ${admin.email} (isAdmin)`);
}

main()
  .catch((e) => {
    console.error("[seed:admin] failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
