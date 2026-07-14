import { prisma } from "./prisma";

// Rolling window used consistently for "90-day" cost/downtime figures.
export const WINDOW_DAYS = 90;

export function windowStart(days: number, now: Date = new Date()): Date {
  return new Date(now.getTime() - days * 86_400_000);
}

export interface AssetMetric {
  costCents: number;
  downtimeHours: number;
  woCount: number;
}

/**
 * Per-asset cost (parts + labor) and downtime over the trailing window, keyed
 * by assetId. Computed in SQL via groupBy — no per-row JS loops. Work orders
 * are attributed to the window by openedAt.
 */
export async function assetMetrics(
  orgId: string,
  days: number = WINDOW_DAYS,
  now: Date = new Date(),
): Promise<Map<string, AssetMetric>> {
  const gte = windowStart(days, now);
  const rows = await prisma.workOrder.groupBy({
    by: ["assetId"],
    where: { orgId, openedAt: { gte }, status: { not: "cancelled" } },
    _sum: { partsCostCents: true, laborCostCents: true, downtimeHours: true },
    _count: { _all: true },
  });

  const map = new Map<string, AssetMetric>();
  for (const r of rows) {
    map.set(r.assetId, {
      costCents:
        (r._sum.partsCostCents ?? 0) + (r._sum.laborCostCents ?? 0),
      downtimeHours: Number(r._sum.downtimeHours ?? 0),
      woCount: r._count._all,
    });
  }
  return map;
}

export const EMPTY_METRIC: AssetMetric = {
  costCents: 0,
  downtimeHours: 0,
  woCount: 0,
};
