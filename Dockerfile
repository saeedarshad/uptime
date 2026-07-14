# Multi-stage build producing a small standalone Next.js server for Dokku.
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# --- deps ---
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# --- builder ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# `npm run build` runs `prisma generate` then `next build`.
RUN npm run build

# --- runner ---
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone server + static assets + public dir.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema, migrations, generated client and CLI (for migrate deploy on boot).
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && mkdir -p /data/uploads && chown -R nextjs:nodejs /data /app

USER nextjs
# Persisted uploads live on a mounted volume (see README).
ENV UPLOAD_DIR=/data/uploads
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
