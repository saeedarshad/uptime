import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

type Tx = Prisma.TransactionClient | PrismaClient;

/** Next per-org sequential work-order number (WO-1, WO-2, …). */
export async function nextWorkOrderNumber(
  orgId: string,
  tx: Tx = prisma,
): Promise<number> {
  const last = await tx.workOrder.findFirst({
    where: { orgId },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  return (last?.number ?? 0) + 1;
}

/** Compute labor cost in cents from hours and the org's labor rate. */
export function laborCostCents(
  laborHours: number,
  laborRateCents: number,
): number {
  return Math.round(laborHours * laborRateCents);
}

export function formatWoNumber(n: number): string {
  return `WO-${n}`;
}

/**
 * Create a work order with a race-safe sequential number. Retries on the rare
 * unique-constraint collision from concurrent creates.
 */
export async function createWorkOrder(
  orgId: string,
  data: Omit<Prisma.WorkOrderUncheckedCreateInput, "orgId" | "number">,
): Promise<{ id: string; number: number }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const number = await nextWorkOrderNumber(orgId);
      const wo = await prisma.workOrder.create({
        data: { ...data, orgId, number },
        select: { id: true, number: true },
      });
      return wo;
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code?: string }).code === "P2002"
      ) {
        continue; // number collided; recompute and retry
      }
      throw err;
    }
  }
  throw new Error("Could not allocate a work-order number");
}
