"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { BusinessType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSession } from "@/lib/auth";
import { uniqueOrgSlug } from "@/lib/slug";
import { defaultSymptomChips } from "@/lib/businessTypes";

export interface FormState {
  error?: string;
}

const registerSchema = z.object({
  orgName: z.string().min(2, "Business name is required"),
  businessType: z.enum([
    "auto",
    "machine_shop",
    "gym",
    "contractor",
    "restaurant",
    "other",
  ]),
  city: z.string().optional(),
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    orgName: formData.get("orgName"),
    businessType: formData.get("businessType"),
    city: formData.get("city") || undefined,
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  const businessType = data.businessType as BusinessType;
  const slug = await uniqueOrgSlug(data.orgName);
  const trialEndsAt = new Date(Date.now() + 14 * 86_400_000);

  const user = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: data.orgName,
        slug,
        businessType,
        city: data.city,
        plan: "trial",
        trialEndsAt,
        symptomChips: defaultSymptomChips(businessType),
      },
    });
    return tx.user.create({
      data: {
        orgId: org.id,
        email,
        name: data.name,
        role: "owner",
        passwordHash: await hashPassword(data.password),
      },
    });
  });

  await createSession(user.id);
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Incorrect email or password" };
  }
  await createSession(user.id);
  redirect("/dashboard");
}
