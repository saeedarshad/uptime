# UptimeHQ

Multi-tenant equipment-maintenance tracking for small businesses (auto shops,
machine shops, gyms, contractors). Every machine gets a QR label; technicians
scan it to report a problem in under 30 seconds; owners get an analytics
dashboard and a plain-English **Insights** feed that flags which machines are
wasting money.

**Core loop:** log repairs → get PM reminders → see which asset is eating the budget.

- Next.js 14 (App Router) + TypeScript (strict)
- PostgreSQL + Prisma
- Email/password auth with DB-backed sessions
- Local-disk file storage behind a swappable driver (S3 stub included)
- Server-side PDF via `pdf-lib` (no headless Chrome)
- SMTP email via `nodemailer` (no-ops in dev when unset)
- Tailwind + recharts
- Single Dockerfile, deploys on Dokku

---

## Local setup

**Prerequisites:** Node 20+, Docker (for Postgres), npm.

```bash
# 1. Start a Postgres for development
docker run -d --name uptime-pg \
  -e POSTGRES_PASSWORD=uptime -e POSTGRES_USER=uptime -e POSTGRES_DB=uptime \
  -p 5433:5432 postgres:16-alpine

# 2. Install dependencies
npm install

# 3. Configure env (a working .env is included for local dev; copy the example otherwise)
cp .env.example .env   # then edit as needed

# 4. Apply migrations and generate the client
npm run migrate:dev

# 5. Seed the demo org (Route 66 Auto Care)
npm run seed

# 6. Run
npm run dev
# → http://localhost:3000
```

**Demo logins** (after seeding):

| Role  | Email                | Password   |
| ----- | -------------------- | ---------- |
| Owner | `demo@uptimehq.app`  | `demo1234` |
| Tech  | `tech@uptimehq.app`  | `demo1234` |

The seed is shaped so all seven insight rules fire and the dashboard shows real
numbers immediately.

**Per-industry demo clients.** On production/staging startup (and locally via
`npm run seed:demos`) the app also seeds one fully-populated demo org per
business type, so you always have an industry-matched account to log into.
Credentials follow `demo<industry>@uptimehq.app` / `demo<industry>4213`:

| Industry           | Email                          | Password              |
| ------------------ | ------------------------------ | --------------------- |
| Auto shop          | `demoauto@uptimehq.app`        | `demoauto4213`        |
| Machine shop       | `demomachineshop@uptimehq.app` | `demomachineshop4213` |
| Gym / fitness      | `demogym@uptimehq.app`         | `demogym4213`         |
| Contractor         | `democontractor@uptimehq.app`  | `democontractor4213`  |
| Restaurant / cafe  | `demorestaurant@uptimehq.app`  | `demorestaurant4213`  |

Seeding is idempotent (orgs are created only when missing); set `DEMO_RESEED=true`
to wipe and rebuild them, or `SEED_DEMOS=false` to skip it in production.

---

## Environment variables

| Variable            | Required | Description                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`      | ✅        | Postgres connection string.                                                 |
| `APP_URL`           | ✅        | Public base URL (used to build QR + invite links). No trailing slash.       |
| `SESSION_SECRET`    | ✅        | Secret used to sign session/PIN cookies. `openssl rand -hex 32`.            |
| `CRON_SECRET`       | ✅        | Bearer secret guarding `POST /api/jobs/run`.                                |
| `UPLOAD_DIR`        | ✅        | Directory for uploaded photos/documents (mount a volume in prod).           |
| `STORAGE_DRIVER`    |          | `local` (default) or `s3` (stubbed for later).                              |
| `SEED_DEMOS`        |          | Seed per-industry demo orgs on boot. Auto-on in prod; `true`/`false` override. |
| `DEMO_RESEED`       |          | When `true`, wipe & rebuild the demo orgs instead of skipping existing ones.   |
| `SMTP_HOST`         |          | SMTP server. **If unset, all email no-ops and logs to the console.**        |
| `SMTP_PORT`         |          | Default `587` (`465` implies TLS).                                          |
| `SMTP_USER`/`PASS`  |          | SMTP credentials.                                                           |
| `SMTP_FROM`         |          | From address, e.g. `UptimeHQ <no-reply@uptimehq.app>`.                       |

---

## Scripts

| Command               | Description                                              |
| --------------------- | -------------------------------------------------------- |
| `npm run dev`         | Dev server.                                              |
| `npm run build`       | `prisma generate` + `next build` (standalone output).    |
| `npm run start`       | Production server (prefer `node .next/standalone/server.js`). |
| `npm run typecheck`   | `tsc --noEmit`.                                          |
| `npm test`            | Vitest (unit + tenant-isolation integration).           |
| `npm run migrate:dev` | Create/apply a dev migration.                            |
| `npm run seed`        | Seed / reset the demo org.                               |
| `npm run cron`        | Run the nightly job once (PM sync, insights, digests).   |

---

## The nightly job

`scripts/cron.ts` (a.k.a. `npm run cron`) and `POST /api/jobs/run` both run the
same work for every org:

1. Generate/refresh PM tasks (upcoming → due → overdue).
2. Recompute insights (rules R1–R7, dedupe + auto-clear).
3. Send digest emails; on the 1st of the month, send the monthly owner summary.

Trigger it over HTTP (e.g. from an external scheduler):

```bash
curl -X POST https://YOUR_APP/api/jobs/run -H "x-cron-secret: $CRON_SECRET"
```

---

## Insight rules

Computed nightly and on-demand ("Recalculate"). Each is a pure function in
[`src/lib/insightRules.ts`](src/lib/insightRules.ts) with fixture tests.

| Key                 | Severity | Fires when…                                                                 |
| ------------------- | -------- | --------------------------------------------------------------------------- |
| `repair_vs_replace` | critical | 365-day cost ≥ 50% of purchase cost, or 90-day cost ≥ 3× the org median (min $500). |
| `repeat_failure`    | warn     | ≥ 3 work orders on one asset within 180 days.                               |
| `overdue_pm_risk`   | warn     | ≥ 1 PM task overdue (adds a breakdown-ratio note when supported).           |
| `rising_spend`      | warn     | Spend rose 3 consecutive complete months.                                   |
| `downtime_hotspot`  | warn     | One asset > 40% of org downtime (90d, ≥ 10 hrs).                            |
| `cert_expiring`     | critical | A document expires within 30 days.                                          |
| `audit_ready`       | info     | A compliance asset with ≥ 6 months history and no overdue PMs.             |

---

## Deploying on Dokku

```bash
# On the Dokku host
dokku apps:create uptimehq

# Postgres
dokku plugin:install https://github.com/dokku/dokku-postgres.git
dokku postgres:create uptimehq-db
dokku postgres:link uptimehq-db uptimehq   # sets DATABASE_URL

# Config
dokku config:set uptimehq \
  APP_URL=https://uptime.example.com \
  SESSION_SECRET=$(openssl rand -hex 32) \
  CRON_SECRET=$(openssl rand -hex 32) \
  UPLOAD_DIR=/data/uploads \
  STORAGE_DRIVER=local
# (optional) SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

# Persistent storage for uploaded photos/documents
dokku storage:ensure-directory uptimehq
dokku storage:mount uptimehq /var/lib/dokku/data/storage/uptimehq:/data/uploads

# Deploy (git push or from a registry). The container runs
# `prisma migrate deploy` on boot via docker-entrypoint.sh, then starts the server.
git remote add dokku dokku@YOUR_HOST:uptimehq
git push dokku main
```

**Healthcheck:** `GET /api/health` (wired in `app.json` and returns DB status).

**Nightly cron** — run the job daily via the host crontab:

```cron
# 6am daily
0 6 * * *  curl -fsS -X POST https://uptime.example.com/api/jobs/run -H "x-cron-secret: THE_SECRET" > /dev/null
```

(or `dokku cron` / a `dokku run uptimehq npm run cron` scheduled task.)

---

## Architecture notes

- **Multi-tenant safety.** Every tenant-owned query goes through
  [`tenantDb(orgId)`](src/lib/tenant.ts), which auto-injects `orgId` into every
  `where` and strips it from write payloads — you cannot run an unscoped query
  through it. Proven by [`tests/tenant-isolation.test.ts`](tests/tenant-isolation.test.ts).
- **Money** is stored in integer cents; **dates** are stored UTC and displayed
  in the org timezone.
- **Public scan flow** (`/a/{publicId}`) resolves by an unguessable 10-char
  slug and is intentionally login-free, gated by an optional shop PIN.
- **Storage** is behind a driver interface; swap `STORAGE_DRIVER=s3` once the S3
  driver is implemented.

## Testing

```bash
npm test        # 51 tests: insight rules, PM logic, compliance, CSV, org-scoping, tenant isolation
npm run typecheck
```
