import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  if (await getAuth()) redirect("/dashboard");
  return (
    <div className="card p-6">
      <h1 className="mb-1 text-lg font-bold text-graphite">
        Start your free trial
      </h1>
      <p className="mb-5 text-sm text-graphite/60">
        14 days free. Unlimited users. No card required.
      </p>
      <RegisterForm />
      <p className="mt-5 text-center text-sm text-graphite/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-safety">
          Sign in
        </Link>
      </p>
    </div>
  );
}
