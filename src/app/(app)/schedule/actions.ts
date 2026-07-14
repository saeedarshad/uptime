"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { PmTriggerType } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { syncPmTasksForOrg, completePmTask } from "@/lib/jobs";
import { logActivity } from "@/lib/activity";

export interface ScheduleState {
  error?: string;
  ok?: boolean;
}

const scheduleSchema = z
  .object({
    assetId: z.string().min(1, "Pick an asset"),
    taskName: z.string().min(1, "Name the task"),
    instructions: z.string().optional(),
    triggerType: z.enum(["time", "meter"]),
    intervalDays: z.string().optional(),
    meterIntervalUnits: z.string().optional(),
    meterUnitLabel: z.string().optional(),
  })
  .refine(
    (d) =>
      d.triggerType === "time"
        ? Number(d.intervalDays) > 0
        : Number(d.meterIntervalUnits) > 0 && !!d.meterUnitLabel?.trim(),
    { message: "Fill in the interval for the chosen trigger type" },
  );

export async function createScheduleAction(
  _prev: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  const { org, user } = await requireAuth();
  const parsed = scheduleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const asset = await tenantDb(org.id).asset.findFirst({
    where: { id: d.assetId },
  });
  if (!asset) return { error: "Asset not found" };

  const isTime = d.triggerType === "time";
  await tenantDb(org.id).pmSchedule.create({
    data: {
      assetId: d.assetId,
      taskName: d.taskName,
      instructions: d.instructions || null,
      triggerType: d.triggerType as PmTriggerType,
      intervalDays: isTime ? Number(d.intervalDays) : null,
      meterIntervalUnits: isTime ? null : Number(d.meterIntervalUnits),
      meterUnitLabel: isTime ? null : d.meterUnitLabel?.trim() || null,
    },
  });
  // Generate the first occurrence.
  await syncPmTasksForOrg(org.id);
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "added PM schedule",
    subject: `${d.taskName} on ${asset.name}`,
  });
  revalidatePath("/schedule");
  redirect("/schedule");
}

export async function setScheduleActiveAction(
  id: string,
  active: boolean,
): Promise<void> {
  const { org } = await requireAuth();
  await tenantDb(org.id).pmSchedule.updateMany({
    where: { id },
    data: { active },
  });
  revalidatePath("/schedule");
}

export async function logAsDoneAction(
  _prev: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  const { org, user } = await requireAuth();
  const taskId = String(formData.get("taskId") ?? "");
  const completedByName =
    String(formData.get("completedByName") ?? "").trim() || user.name;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!taskId) return { error: "Missing task" };

  try {
    await completePmTask(org.id, taskId, completedByName, notes);
  } catch {
    return { error: "That task could not be completed" };
  }
  await logActivity({
    orgId: org.id,
    actorName: completedByName,
    verb: "completed PM task",
    subject: String(formData.get("taskName") ?? "").trim() || "maintenance task",
  });
  revalidatePath("/schedule");
  return { ok: true };
}
