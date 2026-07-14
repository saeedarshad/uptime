-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('auto', 'machine_shop', 'gym', 'contractor', 'other');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('trial', 'active', 'cancelled');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'tech');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('running', 'down', 'retired');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('open', 'in_progress', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'normal', 'high');

-- CreateEnum
CREATE TYPE "PmTriggerType" AS ENUM ('time', 'meter');

-- CreateEnum
CREATE TYPE "PmTaskStatus" AS ENUM ('upcoming', 'due', 'overdue', 'done', 'skipped');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('manual', 'certificate', 'inspection', 'other');

-- CreateEnum
CREATE TYPE "InsightSeverity" AS ENUM ('info', 'warn', 'critical');

-- CreateEnum
CREATE TYPE "InsightAction" AS ENUM ('create_wo', 'view_schedule', 'export_pdf', 'none');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL DEFAULT 'other',
    "city" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "laborRateCents" INTEGER NOT NULL DEFAULT 7500,
    "pinCode" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'trial',
    "trialEndsAt" TIMESTAMP(3),
    "symptomChips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'tech',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'tech',
    "token" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "location" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'running',
    "purchaseCostCents" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "photoUrl" TEXT,
    "notes" TEXT,
    "isComplianceTracked" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "symptom" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'open',
    "priority" "Priority" NOT NULL DEFAULT 'normal',
    "reportedByName" TEXT NOT NULL,
    "assignedToUserId" TEXT,
    "partsCostCents" INTEGER NOT NULL DEFAULT 0,
    "laborHours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "laborCostCents" INTEGER NOT NULL DEFAULT 0,
    "downtimeHours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderPhoto" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PMSchedule" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "instructions" TEXT,
    "triggerType" "PmTriggerType" NOT NULL DEFAULT 'time',
    "intervalDays" INTEGER,
    "meterIntervalUnits" INTEGER,
    "meterUnitLabel" TEXT,
    "lastCompletedAt" TIMESTAMP(3),
    "lastCompletedMeter" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PMTask" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "dueMeter" DECIMAL(12,2),
    "status" "PmTaskStatus" NOT NULL DEFAULT 'upcoming',
    "completedAt" TIMESTAMP(3),
    "completedByName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PMTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enteredByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDocument" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL DEFAULT 'other',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "assetId" TEXT,
    "severity" "InsightSeverity" NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionType" "InsightAction" NOT NULL DEFAULT 'none',
    "dedupeKey" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "verb" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_orgId_idx" ON "Invite"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_publicId_key" ON "Asset"("publicId");

-- CreateIndex
CREATE INDEX "Asset_orgId_idx" ON "Asset"("orgId");

-- CreateIndex
CREATE INDEX "WorkOrder_orgId_idx" ON "WorkOrder"("orgId");

-- CreateIndex
CREATE INDEX "WorkOrder_assetId_idx" ON "WorkOrder"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_orgId_number_key" ON "WorkOrder"("orgId", "number");

-- CreateIndex
CREATE INDEX "WorkOrderPhoto_workOrderId_idx" ON "WorkOrderPhoto"("workOrderId");

-- CreateIndex
CREATE INDEX "PMSchedule_orgId_idx" ON "PMSchedule"("orgId");

-- CreateIndex
CREATE INDEX "PMSchedule_assetId_idx" ON "PMSchedule"("assetId");

-- CreateIndex
CREATE INDEX "PMTask_orgId_idx" ON "PMTask"("orgId");

-- CreateIndex
CREATE INDEX "PMTask_scheduleId_idx" ON "PMTask"("scheduleId");

-- CreateIndex
CREATE INDEX "MeterReading_assetId_idx" ON "MeterReading"("assetId");

-- CreateIndex
CREATE INDEX "AssetDocument_assetId_idx" ON "AssetDocument"("assetId");

-- CreateIndex
CREATE INDEX "Insight_orgId_idx" ON "Insight"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Insight_orgId_dedupeKey_key" ON "Insight"("orgId", "dedupeKey");

-- CreateIndex
CREATE INDEX "ActivityLog_orgId_idx" ON "ActivityLog"("orgId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderPhoto" ADD CONSTRAINT "WorkOrderPhoto_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMSchedule" ADD CONSTRAINT "PMSchedule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMSchedule" ADD CONSTRAINT "PMSchedule_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMTask" ADD CONSTRAINT "PMTask_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PMTask" ADD CONSTRAINT "PMTask_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "PMSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDocument" ADD CONSTRAINT "AssetDocument_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
