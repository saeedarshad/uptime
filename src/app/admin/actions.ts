"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { BillingInterval } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword, verifyPassword } from "@/lib/auth";
import { syncOrgSubscription } from "@/lib/subscription";
import { dollarsToCents } from "@/lib/format";
import { sendEmailToMany } from "@/lib/email";
import { renewalConfirmation } from "@/lib/emailTemplates";

export interface AdminState {
  error?: string;
  ok?: boolean;
  message?: string;
}

const paymentSchema = z
  .object({
    orgId: z.string().min(1),
    interval: z.enum(["monthly", "annual"]),
    amount: z.string().min(1, "Amount is required"),
    periodStart: z.string().min(1, "Start date is required"),
    periodEnd: z.string().min(1, "End date is required"),
    paidAt: z.string().optional(),
    method: z.string().optional(),
    reference: z.string().optional(),
    note: z.string().optional(),
  })
  .refine((d) => new Date(d.periodEnd) > new Date(d.periodStart), {
    message: "End date must be after the start date",
    path: ["periodEnd"],
  });

export async function recordPayment(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdmin();
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const amountCents = dollarsToCents(Number(d.amount));
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { error: "Enter a valid amount" };
  }

  await prisma.subscriptionPayment.create({
    data: {
      orgId: d.orgId,
      interval: d.interval as BillingInterval,
      amountCents,
      periodStart: new Date(d.periodStart),
      periodEnd: new Date(d.periodEnd),
      paidAt: d.paidAt ? new Date(d.paidAt) : new Date(),
      method: d.method?.trim() || null,
      reference: d.reference?.trim() || null,
      note: d.note?.trim() || null,
      createdByAdminEmail: admin.user.email,
    },
  });
  await syncOrgSubscription(d.orgId);

  // Confirm the payment to the org's owners/admins. Non-blocking.
  const org = await prisma.organization.findUnique({
    where: { id: d.orgId },
    select: { name: true, timezone: true },
  });
  if (org) {
    const managers = await prisma.user.findMany({
      where: { orgId: d.orgId, role: { in: ["owner", "admin"] } },
      select: { email: true },
    });
    const { subject, html, text } = renewalConfirmation(
      org.name,
      amountCents,
      new Date(d.periodEnd),
      org.timezone,
    );
    await sendEmailToMany(
      managers.map((m) => m.email),
      { subject, html, text },
    );
  }

  revalidatePath(`/admin/orgs/${d.orgId}`);
  revalidatePath("/admin");
  return { ok: true, message: "Payment recorded" };
}

export async function voidPayment(
  paymentId: string,
  orgId: string,
): Promise<void> {
  await requireAdmin();
  await prisma.subscriptionPayment.update({
    where: { id: paymentId },
    data: { voided: true },
  });
  await syncOrgSubscription(orgId);
  revalidatePath(`/admin/orgs/${orgId}`);
  revalidatePath("/admin");
}

const trialSchema = z.object({
  orgId: z.string().min(1),
  trialEndsAt: z.string().min(1, "Pick a date"),
});

export async function setTrialEnds(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin();
  const parsed = trialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  await prisma.organization.update({
    where: { id: parsed.data.orgId },
    data: { trialEndsAt: new Date(parsed.data.trialEndsAt), plan: "trial" },
  });
  revalidatePath(`/admin/orgs/${parsed.data.orgId}`);
  revalidatePath("/admin");
  return { ok: true, message: "Trial updated" };
}

export async function cancelSubscription(orgId: string): Promise<void> {
  await requireAdmin();
  await prisma.organization.update({
    where: { id: orgId },
    // Force-expire: clear the paid-through date and mark cancelled.
    data: { currentPeriodEndsAt: null, plan: "cancelled" },
  });
  revalidatePath(`/admin/orgs/${orgId}`);
  revalidatePath("/admin");
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "New password must be at least 8 characters"),
    confirm: z.string().min(1, "Confirm the new password"),
  })
  .refine((d) => d.next === d.confirm, {
    message: "New passwords do not match",
    path: ["confirm"],
  });

export async function changeAdminPassword(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const { user } = await requireAdmin();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  if (!(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { error: "Current password is incorrect" };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });
  return { ok: true, message: "Password updated" };
}
