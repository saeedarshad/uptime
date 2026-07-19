// Runs once when the Next.js server boots (dev start, or a production/staging
// container start after `migrate deploy`). We use it to seed the per-industry
// demo orgs so a fresh deploy always has demo logins ready.
//
// Gating: enabled automatically in production; opt-in elsewhere via
// SEED_DEMOS=true. Disable in production with SEED_DEMOS=false. Seeding is
// idempotent (see src/lib/seedDemos.ts) so re-running on every boot is safe.

export async function register() {
  // Only run in the Node.js server runtime — never the edge runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const flag = process.env.SEED_DEMOS;
  const enabled = flag === "true" || (flag !== "false" && process.env.NODE_ENV === "production");
  if (!enabled) return;

  try {
    const { seedDemoOrgs } = await import("./src/lib/seedDemos");
    await seedDemoOrgs();
  } catch (err) {
    // Never let seeding take the server down.
    console.error("[instrumentation] demo seeding failed", err);
  }
}
