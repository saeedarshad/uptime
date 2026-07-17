import { requireAuth } from "@/lib/auth";
import { Sidebar, MobileTabs } from "@/components/Nav";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, org } = await requireAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar — sticky, frosted. */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-content/[0.08] bg-surface/80 px-4 py-2.5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-safety to-safety/80 text-xs font-black text-white ring-1 ring-white/20">
              U
            </div>
            <span className="font-bold text-content">UptimeHQ</span>
          </div>
          <div className="hidden items-center gap-2.5 md:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-content/[0.06] text-xs font-bold text-content/70">
              {org.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm font-semibold text-content">
              {org.name}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {org.plan === "trial" && org.trialEndsAt && (
              <span className="hidden items-center gap-1.5 rounded-full bg-warn/10 px-2.5 py-1 text-xs font-semibold text-warn ring-1 ring-inset ring-warn/20 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                Trial
              </span>
            )}
            <ThemeToggle />
            <UserMenu
              userName={user.name}
              userEmail={user.email}
              userRole={user.role}
            />
          </div>
        </header>

        <main
          id="main-content"
          className="flex-1 px-4 py-7 pb-24 md:px-8 md:py-9 md:pb-9"
        >
          <div className="mx-auto max-w-6xl animate-fade-in-up">{children}</div>
        </main>
      </div>
      <MobileTabs />
    </div>
  );
}
