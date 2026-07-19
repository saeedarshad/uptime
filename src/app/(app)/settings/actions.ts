"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { BusinessType, UserRole } from "@prisma/client";
import { requireManager } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { dollarsToCents } from "@/lib/format";
import { newInviteToken } from "@/lib/ids";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/email";
import { inviteEmail } from "@/lib/emailTemplates";
import { appUrl } from "@/lib/qr";

export interface SettingsState {
  error?: string;
  ok?: boolean;
  message?: string;
}

const profileSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  city: z.string().optional(),
  timezone: z.string().min(1),
  businessType: z.enum([
    "auto",
    "machine_shop",
    "gym",
    "contractor",
    "restaurant",
    "other",
  ]),
  laborRate: z.string().optional(),
});

export async function updateOrgProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { org } = await requireManager();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const rate = d.laborRate ? dollarsToCents(Number(d.laborRate)) : null;
  await prisma.organization.update({
    where: { id: org.id },
    data: {
      name: d.name,
      city: d.city || null,
      timezone: d.timezone,
      businessType: d.businessType as BusinessType,
      ...(rate && rate > 0 ? { laborRateCents: rate } : {}),
    },
  });
  revalidatePath("/settings");
  return { ok: true, message: "Profile saved" };
}

export async function updatePin(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { org } = await requireManager();
  const enabled = formData.get("pinEnabled") === "on";
  const pin = String(formData.get("pinCode") ?? "").trim();
  if (enabled) {
    if (!/^\d{4}$/.test(pin)) {
      return { error: "PIN must be exactly 4 digits" };
    }
    await prisma.organization.update({
      where: { id: org.id },
      data: { pinCode: pin },
    });
    return { ok: true, message: "PIN enabled" };
  }
  await prisma.organization.update({
    where: { id: org.id },
    data: { pinCode: null },
  });
  revalidatePath("/settings");
  return { ok: true, message: "PIN disabled" };
}

export async function updateSymptomChips(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { org } = await requireManager();
  const raw = String(formData.get("chips") ?? "");
  const chips = raw
    .split(/[\n,]/)
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 20);
  await prisma.organization.update({
    where: { id: org.id },
    data: { symptomChips: chips },
  });
  revalidatePath("/settings");
  return { ok: true, message: "Symptom chips saved" };
}

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["owner", "admin", "tech"]),
});

export async function inviteUser(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { org, user } = await requireManager();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "That email is already in use" };
  }
  const invite = await tenantDb(org.id).invite.create({
    data: {
      email,
      name: parsed.data.name,
      role: parsed.data.role as UserRole,
      token: newInviteToken(),
    },
  });
  // Email the invite link (the copy-link fallback in settings stays for cases
  // where mail isn't configured). Non-blocking: sendEmail never throws.
  const { subject, html, text } = inviteEmail(
    parsed.data.name,
    org.name,
    `${appUrl()}/invite/${invite.token}`,
  );
  await sendEmail({ to: email, subject, html, text });
  await logActivity({
    orgId: org.id,
    actorName: user.name,
    verb: "invited",
    subject: parsed.data.name,
  });
  revalidatePath("/settings");
  return { ok: true, message: `Invite created for ${parsed.data.name}` };
}

export async function revokeInvite(id: string): Promise<void> {
  const { org } = await requireManager();
  await tenantDb(org.id).invite.deleteMany({
    where: { id, acceptedAt: null },
  });
  revalidatePath("/settings");
}
