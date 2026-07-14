"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getPublicAsset } from "@/lib/publicAsset";
import { isPinSatisfied, tryEnterPin } from "@/lib/pin";
import { storage, buildKey } from "@/lib/storage";
import { createWorkOrder, formatWoNumber } from "@/lib/workorders";
import { logActivity } from "@/lib/activity";

export interface PublicState {
  error?: string;
}

export async function verifyPinAction(
  publicId: string,
  _prev: PublicState,
  formData: FormData,
): Promise<PublicState> {
  const asset = await getPublicAsset(publicId);
  if (!asset) return { error: "Asset not found" };
  const pin = String(formData.get("pin") ?? "");
  if (!tryEnterPin(asset.org, pin)) {
    return { error: "Incorrect PIN" };
  }
  redirect(`/a/${publicId}`);
}

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);

async function savePhotoIfPresent(
  orgId: string,
  formData: FormData,
): Promise<string | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ALLOWED_IMAGE.has(file.type) || file.size > MAX_PHOTO_BYTES) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  const key = buildKey(orgId, "wo-photos", file.type);
  return storage.save(key, buf, file.type);
}

const reportSchema = z.object({
  reporterName: z.string().min(1, "Please choose or enter your name"),
  symptom: z.string().optional(),
  note: z.string().optional(),
});

export async function submitReportAction(
  publicId: string,
  _prev: PublicState,
  formData: FormData,
): Promise<PublicState> {
  const asset = await getPublicAsset(publicId);
  if (!asset) return { error: "Asset not found" };
  if (!isPinSatisfied(asset.org)) redirect(`/a/${publicId}`);

  const parsed = reportSchema.safeParse({
    reporterName: formData.get("reporterName"),
    symptom: formData.get("symptom") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { reporterName, symptom, note } = parsed.data;
  if (!symptom && !note) {
    return { error: "Pick a symptom or add a note so we know what's wrong" };
  }

  const photoUrl = await savePhotoIfPresent(asset.orgId, formData);
  const title = symptom ?? note?.slice(0, 60) ?? "Reported issue";

  const wo = await createWorkOrder(asset.orgId, {
    assetId: asset.id,
    title,
    symptom: symptom ?? null,
    description: note ?? null,
    status: "open",
    priority: "normal",
    reportedByName: reporterName,
    photos: photoUrl
      ? { create: [{ url: photoUrl }] }
      : undefined,
  });

  // A reported problem marks the asset down if it was running.
  if (asset.status === "running") {
    await prisma.asset.update({
      where: { id: asset.id },
      data: { status: "down" },
    });
  }

  await logActivity({
    orgId: asset.orgId,
    actorName: reporterName,
    verb: "reported a problem on",
    subject: `${asset.name} (${formatWoNumber(wo.number)})`,
  });

  revalidatePath(`/a/${publicId}`);
  redirect(`/a/${publicId}?done=report&wo=${wo.number}`);
}

const meterSchema = z.object({
  reporterName: z.string().min(1, "Please choose or enter your name"),
  value: z.coerce.number().finite().nonnegative("Enter a valid reading"),
  unitLabel: z.string().min(1),
});

export async function submitMeterAction(
  publicId: string,
  _prev: PublicState,
  formData: FormData,
): Promise<PublicState> {
  const asset = await getPublicAsset(publicId);
  if (!asset) return { error: "Asset not found" };
  if (!isPinSatisfied(asset.org)) redirect(`/a/${publicId}`);

  const parsed = meterSchema.safeParse({
    reporterName: formData.get("reporterName"),
    value: formData.get("value"),
    unitLabel: formData.get("unitLabel") || "hours",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid reading" };
  }
  const { reporterName, value, unitLabel } = parsed.data;

  await prisma.meterReading.create({
    data: {
      assetId: asset.id,
      value,
      unitLabel,
      enteredByName: reporterName,
    },
  });
  await logActivity({
    orgId: asset.orgId,
    actorName: reporterName,
    verb: "logged a meter reading on",
    subject: `${asset.name} (${value} ${unitLabel})`,
  });

  revalidatePath(`/a/${publicId}`);
  redirect(`/a/${publicId}?done=meter`);
}
