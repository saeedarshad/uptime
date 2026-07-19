"use server";

import { redirect } from "next/navigation";
import { destroySession, getAuth } from "@/lib/auth";
import { createAuthToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { verifyEmail } from "@/lib/emailTemplates";
import { appUrl } from "@/lib/qr";

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export interface ResendState {
  ok?: boolean;
  error?: string;
}

/** Re-send the email-verification link for the signed-in, still-unverified user. */
export async function resendVerification(): Promise<ResendState> {
  const auth = await getAuth();
  if (!auth) return { error: "Please sign in again." };
  if (auth.user.emailVerified) return { ok: true };

  const token = await createAuthToken(auth.user.id, "email_verify");
  const mail = verifyEmail(auth.user.name, `${appUrl()}/verify-email/${token}`);
  const sent = await sendEmail({ to: auth.user.email, ...mail });
  return sent ? { ok: true } : { error: "Couldn't send right now — try again." };
}
