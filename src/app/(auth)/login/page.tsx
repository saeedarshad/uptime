import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getAuth()) redirect("/dashboard");
  return (
    <div className="card p-6">
      <h1 className="mb-1 text-lg font-bold text-graphite">Sign in</h1>
      <p className="mb-5 text-sm text-graphite/60">
        Welcome back. Sign in to your dashboard.
      </p>
      <LoginForm />
      <p className="mt-5 text-center text-sm text-graphite/60">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-safety">
          Create one
        </Link>
      </p>
    </div>
  );
}
