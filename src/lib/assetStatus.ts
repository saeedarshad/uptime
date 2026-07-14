import { prisma } from "./prisma";

/**
 * Keep an asset's running/down status in sync with its open work. An asset is
 * "down" while it has any open or in-progress work order; otherwise it returns
 * to "running". Retired assets are never touched automatically.
 */
export async function recomputeAssetStatusFromOpenWork(
  orgId: string,
  assetId: string,
): Promise<void> {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, orgId },
    select: { status: true },
  });
  if (!asset || asset.status === "retired") return;

  const openCount = await prisma.workOrder.count({
    where: { orgId, assetId, status: { in: ["open", "in_progress"] } },
  });
  const next = openCount > 0 ? "down" : "running";
  if (next !== asset.status) {
    await prisma.asset.update({ where: { id: assetId }, data: { status: next } });
  }
}
