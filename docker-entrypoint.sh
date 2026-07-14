#!/bin/sh
set -e

# Apply any pending database migrations, then boot the standalone server.
# `migrate deploy` is idempotent and safe to run on every container start.
echo "→ Applying database migrations…"
node ./node_modules/prisma/build/index.js migrate deploy

echo "→ Starting UptimeHQ on port ${PORT:-3000}…"
exec node server.js
