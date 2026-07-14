"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export interface AcceptState {
  error?: string;
}

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function acceptInvite(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const invite = await prisma.invite.findUnique({
    where: { token: parsed.data.token },
  });
  if (!invite || invite.acceptedAt) {
    return { error: "This invite is no longer valid" };
  }
  // Guard against the email having been claimed since the invite was created.
  const existing = await prisma.user.findUnique({
    where: { email: invite.email },
  });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        orgId: invite.orgId,
        email: invite.email,
        name: invite.name,
        role: invite.role,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });
    await tx.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return u;
  });

  await createSession(user.id);
  redirect("/dashboard");
}
