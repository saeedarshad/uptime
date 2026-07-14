"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AssetStatus } from "@prisma/client";
import type { DocumentKind } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { storage, buildKey } from "@/lib/storage";
import { newPublicId } from "@/lib/ids";
import { dollarsToCents } from "@/lib/format";
import { logActivity } from "@/lib/activity";
import { parseCsv } from "@/lib/csv";

export interface ActionState {
  error?: string;
  ok?: boolean;
  message?: string;
}

const assetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["running", "down", "retired"]),
  purchaseCost: z.string().optional(),
  purchaseDate: z.string().optional(),
  notes: z.string().optional(),
  isComplianceTracked: z.string().optional(),
});

function parseCost(input?: string): number | null {
  if (!input) return null;
  const n = Number(input.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? dollarsToCents(n) : null;
}

function parseDate(input?: string): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createAsset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org, user } = await requireAuth();
  const parsed = assetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const asset = await tenantDb(org.id).asset.create({
    data: {
      publicId: newPublicId(),
      name: d.name,
      category: d.category || null,
      location: d.location || null,
      status: d.status as AssetStatus,
      purchaseCostCents: parseCost(d.purchaseCost),
      purchaseDate: parseDate(d.purchaseDate),
      notes: d.notes || null,
      isComplianceTracked: d.isComplianceTracked === "on",
    },
  });
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "added asset",
    subject: asset.name,
  });
  revalidatePath("/assets");
  redirect(`/assets/${asset.id}`);
}

export async function updateAsset(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org, user } = await requireAuth();
  const parsed = assetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  await tenantDb(org.id).asset.updateMany({
    where: { id },
    data: {
      name: d.name,
      category: d.category || null,
      location: d.location || null,
      status: d.status as AssetStatus,
      purchaseCostCents: parseCost(d.purchaseCost),
      purchaseDate: parseDate(d.purchaseDate),
      notes: d.notes || null,
      isComplianceTracked: d.isComplianceTracked === "on",
    },
  });
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "updated asset",
    subject: d.name,
  });
  revalidatePath(`/assets/${id}`);
  redirect(`/assets/${id}`);
}

export async function setAssetArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  const { org, user } = await requireAuth();
  const td = tenantDb(org.id);
  const asset = await td.asset.findFirst({ where: { id } });
  if (!asset) return;
  await td.asset.updateMany({ where: { id }, data: { archived } });
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: archived ? "archived asset" : "restored asset",
    subject: asset.name,
  });
  revalidatePath("/assets");
  redirect("/assets");
}

// CSV columns: name, category, location, purchase cost, purchase date.
export async function importAssetsCsv(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org, user } = await requireAuth();
  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) return { error: "Paste or upload CSV content first" };

  let rows: Record<string, string>[];
  try {
    rows = parseCsv(raw);
  } catch {
    return { error: "Could not parse that CSV" };
  }
  if (rows.length === 0) return { error: "No data rows found" };

  const data = rows
    .map((r) => {
      const name = (r.name ?? "").trim();
      if (!name) return null;
      return {
        publicId: newPublicId(),
        name,
        category: (r.category ?? "").trim() || null,
        location: (r.location ?? "").trim() || null,
        purchaseCostCents: parseCost(r["purchase cost"] ?? r.cost),
        purchaseDate: parseDate(r["purchase date"] ?? r.date),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (data.length === 0) {
    return { error: "No rows had a name column" };
  }

  await tenantDb(org.id).asset.createMany({ data });
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "imported assets",
    subject: `${data.length} assets`,
  });
  revalidatePath("/assets");
  redirect("/assets");
}

const MAX_DOC_BYTES = 20 * 1024 * 1024;
const ALLOWED_DOC = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function addAssetDocument(
  assetId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { org, user } = await requireAuth();
  // Ensure the asset belongs to this org.
  const asset = await tenantDb(org.id).asset.findFirst({
    where: { id: assetId },
  });
  if (!asset) return { error: "Asset not found" };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Give the document a title" };
  const kind = (String(formData.get("kind") ?? "other") ||
    "other") as DocumentKind;
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresRaw ? parseDate(expiresRaw) : null;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload" };
  }
  if (!ALLOWED_DOC.has(file.type) || file.size > MAX_DOC_BYTES) {
    return { error: "File must be a PDF or image under 20 MB" };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const key = buildKey(org.id, "documents", file.type);
  const fileUrl = await storage.save(key, buf, file.type);

  await prisma.assetDocument.create({
    data: { assetId, title, kind, expiresAt, fileUrl },
  });
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "added document to",
    subject: `${asset.name} (${title})`,
  });
  revalidatePath(`/assets/${assetId}`);
  return { ok: true };
}
