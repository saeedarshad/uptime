import { prisma } from "./prisma";
import { windowStart } from "./metrics";
import {
  runRules,
  type InsightContext,
  type AssetSnapshot,
  type ExpiringDoc,
} from "./insightRules";

const DAY_MS = 86_400_000;
const MONTH_DAYS = 30;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
    : sorted[mid]!;
}

/** Gather everything the pure rules need. All aggregation is done in SQL. */
export async function buildInsightContext(
  orgId: string,
  now: Date = new Date(),
): Promise<InsightContext> {
  const gte90 = windowStart(90, now);
  const gte180 = windowStart(180, now);
  const gte365 = windowStart(365, now);

  const [
    assets,
    org,
    cost90,
    cost365,
    downtime90,
    count180,
    count90,
    earliestWo,
    overduePmRows,
    overduePmCount,
    docs,
  ] = await Promise.all([
    prisma.asset.findMany({
      where: { orgId, archived: false },
      select: {
        id: true,
        name: true,
        purchaseCostCents: true,
        isComplianceTracked: true,
        createdAt: true,
      },
    }),
    prisma.organization.findUniqueOrThrow({ where: { id: orgId } }),
    prisma.workOrder.groupBy({
      by: ["assetId"],
      where: { orgId, openedAt: { gte: gte90 }, status: { not: "cancelled" } },
      _sum: { partsCostCents: true, laborCostCents: true },
    }),
    prisma.workOrder.groupBy({
      by: ["assetId"],
      where: { orgId, openedAt: { gte: gte365 }, status: { not: "cancelled" } },
      _sum: { partsCostCents: true, laborCostCents: true },
    }),
    prisma.workOrder.groupBy({
      by: ["assetId"],
      where: { orgId, openedAt: { gte: gte90 }, status: { not: "cancelled" } },
      _sum: { downtimeHours: true },
    }),
    prisma.workOrder.groupBy({
      by: ["assetId"],
      where: { orgId, openedAt: { gte: gte180 }, status: { not: "cancelled" } },
      _count: { _all: true },
    }),
    prisma.workOrder.groupBy({
      by: ["assetId"],
      where: { orgId, openedAt: { gte: gte90 }, status: { not: "cancelled" } },
      _count: { _all: true },
    }),
    prisma.workOrder.groupBy({
      by: ["assetId"],
      where: { orgId },
      _min: { openedAt: true },
    }),
    prisma.pMTask.findMany({
      where: { orgId, status: "overdue" },
      select: { schedule: { select: { assetId: true } } },
    }),
    prisma.pMTask.count({ where: { orgId, status: "overdue" } }),
    prisma.assetDocument.findMany({
      where: {
        asset: { orgId },
        expiresAt: { not: null, lte: new Date(now.getTime() + 30 * DAY_MS) },
      },
      select: {
        id: true,
        title: true,
        expiresAt: true,
        asset: { select: { id: true, name: true } },
      },
    }),
  ]);

  const cost90Map = new Map(
    cost90.map((r) => [
      r.assetId,
      (r._sum.partsCostCents ?? 0) + (r._sum.laborCostCents ?? 0),
    ]),
  );
  const cost365Map = new Map(
    cost365.map((r) => [
      r.assetId,
      (r._sum.partsCostCents ?? 0) + (r._sum.laborCostCents ?? 0),
    ]),
  );
  const downtimeMap = new Map(
    downtime90.map((r) => [r.assetId, Number(r._sum.downtimeHours ?? 0)]),
  );
  const count180Map = new Map(count180.map((r) => [r.assetId, r._count._all]));
  const count90Map = new Map(count90.map((r) => [r.assetId, r._count._all]));
  const earliestMap = new Map(
    earliestWo.map((r) => [r.assetId, r._min.openedAt]),
  );
  const overdueAssetIds = new Set(
    overduePmRows.map((r) => r.schedule.assetId),
  );

  const snapshots: AssetSnapshot[] = assets.map((a) => {
    const earliest = earliestMap.get(a.id) ?? a.createdAt;
    const monthsOfHistory =
      (now.getTime() - earliest.getTime()) / (MONTH_DAYS * DAY_MS);
    return {
      id: a.id,
      name: a.name,
      purchaseCostCents: a.purchaseCostCents,
      isComplianceTracked: a.isComplianceTracked,
      cost90dCents: cost90Map.get(a.id) ?? 0,
      cost365dCents: cost365Map.get(a.id) ?? 0,
      downtime90dHours: downtimeMap.get(a.id) ?? 0,
      woCount180d: count180Map.get(a.id) ?? 0,
      woCount90d: count90Map.get(a.id) ?? 0,
      hasOverduePm: overdueAssetIds.has(a.id),
      monthsOfHistory,
    };
  });

  const expiringDocs: ExpiringDoc[] = docs
    .filter((d) => d.expiresAt !== null)
    .map((d) => ({
      docId: d.id,
      assetId: d.asset.id,
      assetName: d.asset.name,
      title: d.title,
      daysRemaining: Math.ceil((d.expiresAt!.getTime() - now.getTime()) / DAY_MS),
    }));

  return {
    now,
    laborRateCents: org.laborRateCents,
    assets: snapshots,
    medianCost90dCents: median(snapshots.map((s) => s.cost90dCents)),
    orgDowntime90dHours: snapshots.reduce((n, s) => n + s.downtime90dHours, 0),
    monthlySpendCents: await lastCompleteMonths(orgId, now, 3),
    overduePmCount,
    expiringDocs,
  };
}

/** Spend for the last `count` complete calendar months (excludes current). */
async function lastCompleteMonths(
  orgId: string,
  now: Date,
  count: number,
): Promise<{ label: string; cents: number }[]> {
  const firstOfCurrent = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count, 1),
  );
  const rows = await prisma.$queryRaw<{ month: Date; cents: bigint }[]>`
    SELECT date_trunc('month', "openedAt") AS month,
           SUM("partsCostCents" + "laborCostCents")::bigint AS cents
    FROM "WorkOrder"
    WHERE "orgId" = ${orgId}
      AND status <> 'cancelled'
      AND "openedAt" >= ${start}
      AND "openedAt" < ${firstOfCurrent}
    GROUP BY 1
  `;
  const byKey = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.month);
    byKey.set(`${d.getUTCFullYear()}-${d.getUTCMonth()}`, Number(r.cents));
  }
  const out: { label: string; cents: number }[] = [];
  for (let i = count; i >= 1; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({
      label: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      cents: byKey.get(`${d.getUTCFullYear()}-${d.getUTCMonth()}`) ?? 0,
    });
  }
  return out;
}

/**
 * Recompute all insights for an org: run the rules, upsert candidates by
 * dedupeKey (preserving any user dismissal), and auto-clear insights whose
 * condition no longer holds. Returns the count of active (undismissed)
 * insights.
 */
export async function recomputeInsights(
  orgId: string,
  now: Date = new Date(),
): Promise<number> {
  const ctx = await buildInsightContext(orgId, now);
  const candidates = runRules(ctx);
  const keep = new Set(candidates.map((c) => c.dedupeKey));

  // Auto-clear: anything not re-produced this run is resolved.
  await prisma.insight.deleteMany({
    where:
      keep.size === 0
        ? { orgId }
        : { orgId, dedupeKey: { notIn: [...keep] } },
  });

  for (const c of candidates) {
    await prisma.insight.upsert({
      where: { orgId_dedupeKey: { orgId, dedupeKey: c.dedupeKey } },
      create: {
        orgId,
        ruleKey: c.ruleKey,
        assetId: c.assetId,
        severity: c.severity,
        title: c.title,
        body: c.body,
        actionType: c.actionType,
        dedupeKey: c.dedupeKey,
        computedAt: now,
      },
      // Preserve dismissedAt: a dismissed insight stays hidden while its
      // condition persists, but its text/severity refresh.
      update: {
        ruleKey: c.ruleKey,
        assetId: c.assetId,
        severity: c.severity,
        title: c.title,
        body: c.body,
        actionType: c.actionType,
        computedAt: now,
      },
    });
  }

  return prisma.insight.count({ where: { orgId, dismissedAt: null } });
}
