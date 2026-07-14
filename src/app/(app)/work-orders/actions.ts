"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Priority, WorkOrderStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { storage, buildKey } from "@/lib/storage";
import {
  createWorkOrder,
  laborCostCents,
  formatWoNumber,
} from "@/lib/workorders";
import { dollarsToCents } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { recomputeAssetStatusFromOpenWork } from "@/lib/assetStatus";

export interface WoState {
  error?: string;
  ok?: boolean;
}

function parseMoney(input: FormDataEntryValue | null): number {
  if (!input) return 0;
  const n = Number(String(input).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? dollarsToCents(n) : 0;
}
function parseHours(input: FormDataEntryValue | null): number {
  if (!input) return 0;
  const n = Number(String(input));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// Load a work order scoped to the org, or throw if not found / cross-org.
async function loadWo(orgId: string, id: string) {
  const wo = await tenantDb(orgId).workOrder.findFirst({ where: { id } });
  if (!wo) throw new Error("Work order not found");
  return wo;
}

const createSchema = z.object({
  assetId: z.string().min(1, "Pick an asset"),
  title: z.string().min(1, "Describe the issue"),
  description: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]),
  reportedByName: z.string().min(1, "Who reported this?"),
});

export async function createWorkOrderAction(
  _prev: WoState,
  formData: FormData,
): Promise<WoState> {
  const { org, user } = await requireAuth();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  // Confirm the asset belongs to this org before attaching.
  const asset = await tenantDb(org.id).asset.findFirst({
    where: { id: d.assetId },
  });
  if (!asset) return { error: "That asset was not found" };

  const wo = await createWorkOrder(org.id, {
    assetId: d.assetId,
    title: d.title,
    description: d.description || null,
    priority: d.priority as Priority,
    status: "open",
    reportedByName: d.reportedByName,
  });
  if (asset.status === "running") {
    await prisma.asset.update({
      where: { id: asset.id },
      data: { status: "down" },
    });
  }
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "opened",
    subject: `${formatWoNumber(wo.number)} on ${asset.name}`,
  });
  revalidatePath("/work-orders");
  redirect(`/work-orders/${wo.id}`);
}

const detailSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]),
  status: z.enum(["open", "in_progress", "cancelled"]),
  assignedToUserId: z.string().optional(),
  partsCost: z.string().optional(),
  laborHours: z.string().optional(),
  laborCostOverride: z.string().optional(),
});

export async function updateWorkOrderAction(
  id: string,
  _prev: WoState,
  formData: FormData,
): Promise<WoState> {
  const { org, user } = await requireAuth();
  const wo = await loadWo(org.id, id);
  const parsed = detailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const hours = parseHours(d.laborHours ?? null);
  const override = d.laborCostOverride?.trim()
    ? parseMoney(d.laborCostOverride)
    : null;
  const labor = override ?? laborCostCents(hours, org.laborRateCents);

  // Validate assignee is in this org.
  let assignedToUserId: string | null = null;
  if (d.assignedToUserId) {
    const u = await tenantDb(org.id).user.findFirst({
      where: { id: d.assignedToUserId },
    });
    assignedToUserId = u?.id ?? null;
  }

  await tenantDb(org.id).workOrder.updateMany({
    where: { id },
    data: {
      title: d.title,
      description: d.description || null,
      priority: d.priority as Priority,
      status: d.status as WorkOrderStatus,
      assignedToUserId,
      partsCostCents: parseMoney(d.partsCost ?? null),
      laborHours: hours,
      laborCostCents: labor,
    },
  });
  await recomputeAssetStatusFromOpenWork(org.id, wo.assetId);
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "updated",
    subject: formatWoNumber(wo.number),
  });
  revalidatePath(`/work-orders/${id}`);
  return { ok: true };
}

export async function closeWorkOrderAction(
  id: string,
  _prev: WoState,
  formData: FormData,
): Promise<WoState> {
  const { org, user } = await requireAuth();
  const wo = await loadWo(org.id, id);
  const downtimeHours = parseHours(formData.get("downtimeHours"));

  await tenantDb(org.id).workOrder.updateMany({
    where: { id },
    data: { status: "done", closedAt: new Date(), downtimeHours },
  });
  await recomputeAssetStatusFromOpenWork(org.id, wo.assetId);
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "closed",
    subject: `${formatWoNumber(wo.number)} (${downtimeHours} hrs downtime)`,
  });
  revalidatePath(`/work-orders/${id}`);
  return { ok: true };
}

export async function reopenWorkOrderAction(id: string): Promise<void> {
  const { org, user } = await requireAuth();
  const wo = await loadWo(org.id, id);
  await tenantDb(org.id).workOrder.updateMany({
    where: { id },
    data: { status: "in_progress", closedAt: null },
  });
  await recomputeAssetStatusFromOpenWork(org.id, wo.assetId);
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "reopened",
    subject: formatWoNumber(wo.number),
  });
  revalidatePath(`/work-orders/${id}`);
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function addWorkOrderPhotoAction(
  id: string,
  _prev: WoState,
  formData: FormData,
): Promise<WoState> {
  const { org } = await requireAuth();
  const wo = await loadWo(org.id, id);
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo first" };
  }
  if (!ALLOWED_IMAGE.has(file.type) || file.size > MAX_PHOTO_BYTES) {
    return { error: "Photo must be a JPG/PNG/WebP under 8 MB" };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const key = buildKey(org.id, "wo-photos", file.type);
  const url = await storage.save(key, buf, file.type);
  await prisma.workOrderPhoto.create({ data: { workOrderId: wo.id, url } });
  revalidatePath(`/work-orders/${id}`);
  return { ok: true };
}
