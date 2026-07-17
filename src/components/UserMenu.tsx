"use client";

import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/(app)/actions";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

export function UserMenu({
  userName,
  userEmail,
  userRole,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${userName}`}
        className="flex items-center gap-2 rounded-full border border-content/10 bg-surface py-1 pl-1 pr-2.5 shadow-sm transition-colors hover:border-content/20 hover:bg-content/[0.02]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-graphite to-night text-[11px] font-bold text-white">
          {initials(userName)}
        </span>
        <span className="hidden text-sm font-semibold text-content sm:block">
          {userName.split(" ")[0]}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 text-content/40 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 origin-top-right animate-fade-in-up overflow-hidden rounded-xl border border-content/[0.08] bg-surface shadow-elevated"
        >
          <div className="flex items-center gap-3 border-b border-content/[0.06] px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-graphite to-night text-xs font-bold text-white">
              {initials(userName)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-content">
                {userName}
              </div>
              <div className="truncate text-xs text-content/50">
                {userEmail}
              </div>
            </div>
          </div>
          <div className="px-4 py-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-content/[0.06] px-2.5 py-0.5 text-xs font-semibold capitalize text-content/70">
              {userRole}
            </span>
          </div>
          <div className="border-t border-content/[0.06] p-1.5">
            <form action={logoutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-content/80 transition-colors hover:bg-danger/[0.06] hover:text-danger"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
