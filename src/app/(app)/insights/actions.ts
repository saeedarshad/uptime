"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { recomputeInsights } from "@/lib/insights";

export async function recalculateAction(): Promise<void> {
  const { org } = await requireAuth();
  await recomputeInsights(org.id);
  revalidatePath("/insights");
  revalidatePath("/dashboard");
}

export async function dismissInsightAction(id: string): Promise<void> {
  const { org } = await requireAuth();
  await tenantDb(org.id).insight.updateMany({
    where: { id },
    data: { dismissedAt: new Date() },
  });
  revalidatePath("/insights");
  revalidatePath("/dashboard");
}
