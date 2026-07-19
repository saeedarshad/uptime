/**
 * Manually seed (or reseed) the per-industry demo orgs. On production/staging
 * this runs automatically at server boot via instrumentation.ts; use this script
 * to create them locally or force-refresh them.
 *
 * Run with:  npm run seed:demos          (creates any missing demo orgs)
 *            DEMO_RESEED=true npm run seed:demos   (wipe + rebuild all)
 *
 * Idempotent — safe to re-run. See src/lib/seedDemos.ts and src/lib/demoOrgs.ts.
 */
import { seedDemoOrgs } from "../src/lib/seedDemos";
import { prisma } from "../src/lib/prisma";

async function main() {
  await seedDemoOrgs();
}

main()
  .catch((e) => {
    console.error("[seed:demos] failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
