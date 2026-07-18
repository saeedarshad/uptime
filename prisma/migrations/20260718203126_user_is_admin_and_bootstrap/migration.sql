-- Platform operator is now a normal User with a flag, using the normal login.
-- Add the flag and drop the separate admin-auth tables introduced earlier.
ALTER TABLE "User" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

DROP TABLE IF EXISTS "AdminSession";
DROP TABLE IF EXISTS "PlatformAdmin";

-- Bootstrap the platform operator so /admin works on every deploy. Idempotent:
-- ON CONFLICT DO NOTHING means a redeploy never overwrites a changed password.
-- Default credentials: admin@uptimehq.app / admin9898 (bcrypt hash below).
INSERT INTO "Organization"
  ("id", "name", "slug", "businessType", "timezone", "laborRateCents", "plan", "symptomChips", "createdAt", "updatedAt")
VALUES
  ('org_platform_admin', 'UptimeHQ Platform', 'uptimehq-platform', 'other', 'America/Chicago', 7500, 'active', '{}', now(), now())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "User"
  ("id", "orgId", "email", "passwordHash", "name", "role", "isAdmin", "createdAt", "updatedAt")
VALUES
  ('user_platform_admin', 'org_platform_admin', 'admin@uptimehq.app', '$2a$10$6WHJMphaK4uj8mvLndyUweEu4FO7qmEnGXolXLWcyiof5IRRGrMDa', 'Platform Admin', 'owner', true, now(), now())
ON CONFLICT ("email") DO NOTHING;
