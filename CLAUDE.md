# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**UptimeHQ** — a multi-tenant SaaS for small businesses (auto shops, machine
shops, gyms, contractors) to track equipment maintenance. Techs scan a QR label
to report problems; owners get an analytics dashboard and a plain-English
**Insights** feed. Core loop: log repairs → get PM reminders → see which asset
is eating the budget. Flat pricing, **unlimited users** — nothing assumes
per-seat licensing.

## Stack

Next.js 14 (App Router) + TypeScript (strict) · PostgreSQL + Prisma · DB-backed
email/password sessions · Tailwind · recharts · `pdf-lib` (no headless Chrome) ·
`nodemailer` · deploys as a single Docker image on Dokku.

## Commands

```bash
npm run dev          # dev server → http://localhost:3000
npm run build        # prisma generate + next build (standalone)
npm run typecheck    # tsc --noEmit  (must stay clean; zero `any` in domain code)
npm test             # Vitest (51 tests: rules, PM, compliance, CSV, tenant isolation)
npm run migrate:dev  # create/apply a dev migration
npm run seed         # reset the demo org "Route 66 Auto Care"
npm run cron         # run the nightly job once
```

**Local Postgres** runs in Docker on host port **5433** (container `uptime-pg`).
Start with `docker start uptime-pg`. Demo logins after seeding:
`demo@uptimehq.app` / `demo1234` (owner), `tech@uptimehq.app` / `demo1234`.

Always run `npm run typecheck` and `npm test` before considering a change done.

## Architecture & conventions

- **Multi-tenant safety is non-negotiable.** Never query a tenant-owned table
  with raw `prisma.*` from request/action code. Go through
  [`tenantDb(orgId)`](src/lib/tenant.ts), which auto-injects `orgId` into every
  `where` and strips it from write payloads. Raw `prisma` is only for
  global/non-org tables (Session, and the public-by-`publicId` asset lookup) and
  inside already-org-scoped helpers. Isolation is covered by
  [`tests/tenant-isolation.test.ts`](tests/tenant-isolation.test.ts).
- **Money** is always integer **cents**; format only at the UI edge
  (`src/lib/format.ts`). **Dates** are stored UTC and displayed in the org
  timezone.
- **Auth guards**: `requireAuth()` / `requireManager()` in `src/lib/auth.ts`.
- **Insights** are pure functions in
  [`src/lib/insightRules.ts`](src/lib/insightRules.ts) (fixture-tested); DB
  gathering + upsert/auto-clear live in `src/lib/insights.ts`. Each rule
  produces a candidate with a stable `dedupeKey`; re-running updates in place
  and clears resolved conditions. **Add a unit test for any new/changed rule.**
- **PM scheduling** logic is pure in `src/lib/pm.ts`; the nightly job in
  `src/lib/jobs.ts` applies it. `POST /api/jobs/run` is guarded by `CRON_SECRET`.
- **Storage** is behind a driver interface (`src/lib/storage.ts`); local disk
  today, S3 stubbed. Uploaded images are compressed client-side before upload.

## Routing map (`src/app`)

- `(auth)` — login / register (no shell).
- `(app)` — authenticated shell: dashboard, insights, work-orders, assets,
  schedule, settings. Each page is org-scoped via the guards above.
- `a/[publicId]` — public, login-free QR scan flow (report / meter), optional
  shop-PIN gate.
- `invite/[token]` — accept-invite (set password, join).
- `api/health`, `api/jobs/run`, `api/files/[...key]`.

## Gotchas

- Standalone scripts run by `tsx` (in `scripts/`, `prisma/seed.ts`) must wrap
  logic in an `async main()` — top-level `await` throws a TransformError in the
  CJS context.
- `server-only` is on `auth.ts`/`pin.ts` (cookie-based, must never run in a
  script) but intentionally NOT on `email.ts`/`storage.ts`, which the cron
  script imports.
- Reseeding cascade-deletes sessions, so re-login after `npm run seed`.
- Server Actions bound with `.bind(null, id)` pass the id to the action; keep
  the `(id, prevState, formData)` signature order.

## Non-goals

No parts inventory, purchasing, payments/billing, IoT, native apps,
multi-language, per-seat anything, websockets, or multi-org users.
