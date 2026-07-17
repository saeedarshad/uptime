"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ActionMenuItem = {
  label: string;
  iconPath?: string;
  /** Link target. Mutually exclusive with `action`. */
  href?: string;
  newTab?: boolean;
  /** Server action bound by the caller. Rendered as a submit button. */
  action?: () => void | Promise<void>;
  danger?: boolean;
};

/** Overflow menu for secondary page actions — keeps headers to one primary
 *  button. Supports link items and server-action items in one list. */
export function ActionMenu({
  label = "More",
  items,
}: {
  label?: string;
  items: ActionMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  const itemCls = (danger?: boolean) =>
    `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
      danger
        ? "text-danger/90 hover:bg-danger/[0.06] hover:text-danger"
        : "text-content/80 hover:bg-content/5 hover:text-content"
    }`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-secondary"
      >
        {label}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 text-content/50 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 origin-top-right animate-fade-in-up overflow-hidden rounded-xl border border-content/[0.08] bg-surface p-1.5 shadow-elevated"
        >
          {items.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                target={item.newTab ? "_blank" : undefined}
                rel={item.newTab ? "noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className={itemCls(item.danger)}
              >
                <ItemIcon path={item.iconPath} />
                {item.label}
              </Link>
            ) : (
              <form key={item.label} action={item.action}>
                <button
                  type="submit"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={itemCls(item.danger)}
                >
                  <ItemIcon path={item.iconPath} />
                  {item.label}
                </button>
              </form>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function ItemIcon({ path }: { path?: string }) {
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <path d={path} />
    </svg>
  );
}
