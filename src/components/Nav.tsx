"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(app)/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  dashboard: "M3 12l9-9 9 9M5 10v10h14V10",
  insights: "M3 3v18h18M7 15l4-4 3 3 5-6",
  wo: "M4 6h16M4 12h16M4 18h10",
  assets: "M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7",
  schedule:
    "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  settings:
    "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.82 1.17V21a2 2 0 11-4 0v-.09A1.65 1.65 0 007 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15H4.5a2 2 0 110-4h.09A1.65 1.65 0 006 8.6l-.33-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 0011 4.6V4.5a2 2 0 114 0v.09a1.65 1.65 0 002.51 1.28",
};

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <Icon path={ICONS.dashboard} /> },
  { href: "/insights", label: "Insights", icon: <Icon path={ICONS.insights} /> },
  { href: "/work-orders", label: "Work orders", icon: <Icon path={ICONS.wo} /> },
  { href: "/assets", label: "Assets", icon: <Icon path={ICONS.assets} /> },
  { href: "/schedule", label: "Schedule", icon: <Icon path={ICONS.schedule} /> },
  { href: "/settings", label: "Settings", icon: <Icon path={ICONS.settings} /> },
];

// Mobile bottom bar shows the five most-used destinations.
const MOBILE_ITEMS = ITEMS.filter((i) => i.href !== "/settings");

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  orgName,
  userName,
  userRole,
}: {
  orgName: string;
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-graphite/10 bg-graphite text-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-safety text-sm font-bold">
          U
        </div>
        <span className="text-lg font-bold tracking-tight">UptimeHQ</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-safety text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-2 text-sm font-medium">{userName}</div>
        <div className="mb-3 text-xs capitalize text-white/50">
          {userRole} · {orgName}
        </div>
        <form action={logoutAction}>
          <button className="text-xs font-medium text-white/70 hover:text-white">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-graphite/10 bg-white md:hidden">
      {MOBILE_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              active ? "text-safety" : "text-graphite/50"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
