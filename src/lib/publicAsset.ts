import { prisma } from "./prisma";

/**
 * Look up an asset by its unguessable public slug, with its org. Used by the
 * public (no-login) scan flow. publicId is globally unique, so this does not
 * go through the org-scoped helper.
 */
export async function getPublicAsset(publicId: string) {
  const asset = await prisma.asset.findUnique({
    where: { publicId },
    include: { org: true },
  });
  if (!asset || asset.archived || asset.status === "retired") return null;
  return asset;
}

/** Most recent service date: latest closed work order or PM completion. */
export async function lastServiceAt(assetId: string): Promise<Date | null> {
  const [lastWo, lastPm] = await Promise.all([
    prisma.workOrder.findFirst({
      where: { assetId, status: "done", closedAt: { not: null } },
      orderBy: { closedAt: "desc" },
      select: { closedAt: true },
    }),
    prisma.pMTask.findFirst({
      where: { schedule: { assetId }, status: "done", completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    }),
  ]);
  const dates = [lastWo?.closedAt, lastPm?.completedAt].filter(
    (d): d is Date => d instanceof Date,
  );
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (a > b ? a : b));
}
