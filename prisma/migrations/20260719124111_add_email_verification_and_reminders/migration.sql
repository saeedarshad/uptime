-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('email_verify', 'password_reset');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3);

-- Backfill: existing accounts predate email verification, so treat them as
-- already verified (they should not suddenly be prompted to confirm).
UPDATE "User" SET "emailVerified" = CURRENT_TIMESTAMP WHERE "emailVerified" IS NULL;

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionReminder" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "threshold" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthToken_userId_idx" ON "AuthToken"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionReminder_orgId_idx" ON "SubscriptionReminder"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionReminder_orgId_endsAt_threshold_key" ON "SubscriptionReminder"("orgId", "endsAt", "threshold");

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionReminder" ADD CONSTRAINT "SubscriptionReminder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
