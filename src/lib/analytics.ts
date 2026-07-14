import { prisma } from "./prisma";
import { assetMetrics, windowStart, WINDOW_DAYS } from "./metrics";
import { computeCompliance } from "./pm";

// Dashboard aggregates. Everything here is computed in the database (groupBy or
// raw SQL) rather than by looping over rows in JS.

export interface DashboardStats {
  downtimeHours90d: number;
  spendCents90d: number;
  pmCompliance: number | null; // 0..1, or null when nothing to measure
  openWorkOrders: number;
}

export async function dashboardStats(
  orgId: string,
  now: Date = new Date(),
): Promise<DashboardStats> {
  const gte = windowStart(WINDOW_DAYS, now);

  const [woAgg, openWo, pmTasks] = await Promise.all([
    prisma.workOrder.aggregate({
      where: { orgId, openedAt: { gte }, status: { not: "cancelled" } },
      _sum: { partsCostCents: true, laborCostCents: true, downtimeHours: true },
    }),
    prisma.workOrder.count({
      where: { orgId, status: { in: ["open", "in_progress"] } },
    }),
    prisma.pMTask.findMany({
      where: { orgId },
      select: { status: true, dueAt: true, completedAt: true },
    }),
  ]);

  return {
    downtimeHours90d: Number(woAgg._sum.downtimeHours ?? 0),
    spendCents90d:
      (woAgg._sum.partsCostCents ?? 0) + (woAgg._sum.laborCostCents ?? 0),
    pmCompliance: computeCompliance(pmTasks, now, WINDOW_DAYS),
    openWorkOrders: openWo,
  };
}

export interface AssetCostRow {
  name: string;
  cents: number;
}

/** Top-N assets by 90-day cost, for the "Cost by asset" bar chart. */
export async function costByAsset(
  orgId: string,
  topN = 6,
  now: Date = new Date(),
): Promise<AssetCostRow[]> {
  const metrics = await assetMetrics(orgId, WINDOW_DAYS, now);
  const assetIds = [...metrics.keys()];
  if (assetIds.length === 0) return [];
  const assets = await prisma.asset.findMany({
    where: { orgId, id: { in: assetIds } },
    select: { id: true, name: true },
  });
  const nameById = new Map(assets.map((a) => [a.id, a.name]));
  return [...metrics.entries()]
    .map(([id, m]) => ({ name: nameById.get(id) ?? "Unknown", cents: m.costCents }))
    .filter((r) => r.cents > 0)
    .sort((a, b) => b.cents - a.cents)
    .slice(0, topN);
}

export interface MonthlySpendRow {
  month: string; // e.g. "Feb"
  cents: number;
}

/** Maintenance spend per month for the trailing `months` months. */
export async function monthlySpend(
  orgId: string,
  months = 6,
  now: Date = new Date(),
): Promise<MonthlySpendRow[]> {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
  );
  const rows = await prisma.$queryRaw<{ month: Date; cents: bigint }[]>`
    SELECT date_trunc('month', "openedAt") AS month,
           SUM("partsCostCents" + "laborCostCents")::bigint AS cents
    FROM "WorkOrder"
    WHERE "orgId" = ${orgId}
      AND status <> 'cancelled'
      AND "openedAt" >= ${start}
    GROUP BY 1
  `;
  const byKey = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.month);
    byKey.set(`${d.getUTCFullYear()}-${d.getUTCMonth()}`, Number(r.cents));
  }
  const out: MonthlySpendRow[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    out.push({
      month: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      cents: byKey.get(key) ?? 0,
    });
  }
  return out;
}

export async function recentActivity(orgId: string, limit = 8) {
  return prisma.activityLog.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Highest-priority undismissed insight, for the dashboard banner. */
export async function topInsight(orgId: string) {
  const insights = await prisma.insight.findMany({
    where: { orgId, dismissedAt: null },
  });
  if (insights.length === 0) return null;
  const rank: Record<string, number> = { critical: 3, warn: 2, info: 1 };
  return insights.sort(
    (a, b) => (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0),
  )[0];
}
