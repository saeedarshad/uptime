import { requireAuth } from "@/lib/auth";
import { Sidebar, MobileTabs } from "@/components/Nav";
import { logoutAction } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, org } = await requireAuth();

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar orgName={org.name} userName={user.name} userRole={user.role} />
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-graphite/10 bg-white px-4 py-3 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-safety text-xs font-bold text-white">
              U
            </div>
            <span className="font-bold text-graphite">UptimeHQ</span>
          </div>
          <div className="hidden text-sm font-semibold text-graphite md:block">
            {org.name}
          </div>
          <div className="flex items-center gap-3">
            {org.plan === "trial" && org.trialEndsAt && (
              <span className="hidden rounded-full bg-warn/10 px-2.5 py-0.5 text-xs font-semibold text-warn sm:inline">
                Trial
              </span>
            )}
            <form action={logoutAction} className="md:hidden">
              <button className="text-xs font-medium text-graphite/60">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileTabs />
    </div>
  );
}
