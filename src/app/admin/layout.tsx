import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { logoutAction } from "../(app)/actions";

export const metadata = { title: "Admin — UptimeHQ" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Not a guard — pages guard themselves with requireAdmin(). This just renders
  // the operator bar when an admin is signed in.
  const auth = await getAuth();
  const admin = auth?.user.isAdmin ? auth.user : null;

  return (
    <div className="min-h-screen bg-canvas">
      {admin && (
        <header className="sticky top-0 z-30 border-b border-content/[0.08] bg-surface/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-night to-ink text-xs font-black text-white ring-1 ring-white/20">
                U
              </span>
              <span className="font-bold text-content">
                UptimeHQ{" "}
                <span className="font-medium text-content/40">Admin</span>
              </span>
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/dashboard" className="btn-ghost text-sm">
                Exit to app
              </Link>
              <span className="hidden text-content/50 sm:inline">
                {admin.email}
              </span>
              <form action={logoutAction}>
                <button className="btn-ghost text-sm">Sign out</button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
