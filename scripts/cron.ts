/**
 * Nightly maintenance job. Run by system cron / Dokku cron, e.g.:
 *   0 6 * * *  cd /app && node scripts/cron.js   (or: npm run cron)
 *
 * Generates/refreshes PM tasks, recomputes insights, and sends digest emails
 * for every org. Also reachable at runtime via POST /api/jobs/run.
 */
import { runNightlyJob } from "../src/lib/jobs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const start = Date.now();
  const result = await runNightlyJob();
  console.log(
    `[cron] done in ${Date.now() - start}ms:`,
    JSON.stringify(result),
  );
}

main()
  .catch((e) => {
    console.error("[cron] failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
