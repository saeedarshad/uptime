import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  if (await getAuth()) redirect("/dashboard");
  return (
    <div className="card p-7 sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-graphite">
        Start your free trial
      </h1>
      <p className="mb-6 mt-1 text-sm text-graphite/60">
        14 days free. Unlimited users. No card required.
      </p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-graphite/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-safety hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
