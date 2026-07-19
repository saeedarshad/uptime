import { createHash } from "crypto";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ResetForm } from "./ResetForm";

export const metadata = { title: "Choose a new password — UptimeHQ" };

/**
 * Validate the reset token up front (without consuming it) so an expired/used
 * link shows a helpful message instead of a form that will fail on submit.
 * Actual consumption happens in `resetPasswordAction` on submit.
 */
async function tokenIsValid(token: string): Promise<boolean> {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.authToken.findUnique({ where: { tokenHash } });
  return (
    !!record &&
    record.type === "password_reset" &&
    record.consumedAt === null &&
    record.expiresAt.getTime() > Date.now()
  );
}

export default async function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const valid = await tokenIsValid(params.token);

  if (!valid) {
    return (
      <div className="card p-7 sm:p-8">
        <h1 className="text-xl font-bold tracking-tight text-content">
          Link expired
        </h1>
        <p className="mb-6 mt-1 text-sm text-content/60">
          This reset link is invalid or has already been used. Request a fresh
          one to continue.
        </p>
        <Link href="/forgot-password" className="btn-primary inline-flex">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-7 sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-content">
        Choose a new password
      </h1>
      <p className="mb-6 mt-1 text-sm text-content/60">
        Pick a strong password you don't use elsewhere.
      </p>
      <ResetForm token={params.token} />
    </div>
  );
}
