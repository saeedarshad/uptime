import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { consumeAuthToken } from "@/lib/tokens";

export const metadata = { title: "Confirm your email — UptimeHQ" };

/**
 * Verification link target. Consumes the token, marks the user verified, and
 * bounces to the dashboard. Idempotent: if the link was already used but the
 * signed-in user is verified, we still show success (email scanners often
 * pre-fetch the link, consuming it before the human clicks).
 */
export default async function VerifyEmailPage({
  params,
}: {
  params: { token: string };
}) {
  const userId = await consumeAuthToken(params.token, "email_verify");

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });
    redirect("/dashboard");
  }

  // Token unknown/expired/used. If the current session is already verified,
  // it's effectively done — send them in. Otherwise surface a friendly error.
  const auth = await getAuth();
  if (auth?.user.emailVerified) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md p-7 text-center sm:p-8">
        <h1 className="text-xl font-bold text-content">Link expired</h1>
        <p className="mt-2 text-sm text-content/60">
          This verification link is invalid or has already been used. Sign in and
          use the “Resend email” banner to get a fresh one.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
