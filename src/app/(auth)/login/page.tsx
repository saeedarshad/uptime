import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getAuth()) redirect("/dashboard");
  return (
    <div className="card p-7 sm:p-8">
      <h1 className="text-xl font-bold tracking-tight text-graphite">Sign in</h1>
      <p className="mb-6 mt-1 text-sm text-graphite/60">
        Welcome back. Sign in to your dashboard.
      </p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-graphite/60">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-safety hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
