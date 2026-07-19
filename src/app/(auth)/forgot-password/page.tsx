import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { ForgotForm } from "./ForgotForm";

export const metadata = { title: "Reset password — UptimeHQ" };

export default async function ForgotPasswordPage() {
  if (await getAuth()) redirect("/dashboard");
  return (
    <div className="card p-7 sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-content">
        Reset your password
      </h1>
      <p className="mb-6 mt-1 text-sm text-content/60">
        Enter your email and we'll send you a link to choose a new password.
      </p>
      <ForgotForm />
      <p className="mt-6 text-center text-sm text-content/60">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-safety hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
