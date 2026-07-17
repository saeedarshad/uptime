"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

// Grouped by mental model: "how are we doing?" vs "what's the work?".
// Settings is configuration — pinned to the footer, out of the daily flow.
const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: <Icon path={ICONS.dashboard} /> },
      { href: "/insights", label: "Insights", icon: <Icon path={ICONS.insights} /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/work-orders", label: "Work orders", icon: <Icon path={ICONS.wo} /> },
      { href: "/assets", label: "Assets", icon: <Icon path={ICONS.assets} /> },
      { href: "/schedule", label: "Schedule", icon: <Icon path={ICONS.schedule} /> },
    ],
  },
];

const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: <Icon path={ICONS.settings} />,
};

// Mobile bottom bar shows the five most-used destinations (Settings lives in the
// account menu on mobile).
const MOBILE_ITEMS = GROUPS.flatMap((g) => g.items);

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-base";
  return (
    <div
      className={`flex ${box} items-center justify-center rounded-lg bg-gradient-to-br from-safety to-safety/80 font-black text-white shadow-sm ring-1 ring-white/20`}
    >
      U
    </div>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        active
          ? "bg-white/[0.08] text-white shadow-inner-line"
          : "text-white/60 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-safety" />
      )}
      <span
        className={
          active
            ? "text-safety"
            : "text-white/50 transition-colors group-hover:text-white/80"
        }
      >
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/20 bg-gradient-to-b from-night to-ink text-white md:flex">
      <div className="flex items-center gap-2.5 px-5 py-[1.05rem]">
        <BrandMark />
        <div className="leading-tight">
          <div className="text-lg font-bold tracking-tight">UptimeHQ</div>
          <div className="text-[11px] font-medium text-white/40">
            Maintenance OS
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="h-px bg-white/10" />
      </div>

      <nav
        aria-label="Main"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4"
      >
        {GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">
              {group.label}
            </div>
            {group.items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-3 p-3">
        <div className="border-t border-white/10 pt-3">
          <SidebarLink
            item={SETTINGS_ITEM}
            active={isActive(pathname, SETTINGS_ITEM.href)}
          />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-safety"
              aria-hidden
            >
              <path d="M12 16v-4m0-4h.01M12 22a10 10 0 100-20 10 10 0 000 20z" />
            </svg>
            Need a hand?
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/50">
            Techs scan the QR label to report issues — no login needed.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-content/10 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 md:hidden"
    >
      {MOBILE_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
              active ? "text-safety" : "text-content/45"
            }`}
          >
            {active && (
              <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-safety" />
            )}
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
