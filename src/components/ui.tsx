import Link from "next/link";
import type { ReactNode } from "react";

type StatusTone = "ok" | "warn" | "danger" | "muted" | "info";

const TONE: Record<StatusTone, string> = {
  ok: "bg-ok/10 text-ok ring-ok/20",
  warn: "bg-warn/10 text-warn ring-warn/20",
  danger: "bg-danger/10 text-danger ring-danger/20",
  muted: "bg-graphite/[0.07] text-graphite/70 ring-graphite/15",
  info: "bg-safety/10 text-safety ring-safety/20",
};

const DOT: Record<StatusTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  muted: "bg-graphite/40",
  info: "bg-safety",
};

export function Badge({
  children,
  tone = "muted",
  dot = false,
}: {
  children: ReactNode;
  tone?: StatusTone;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE[tone]}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} aria-hidden />
      )}
      {children}
    </span>
  );
}

const ASSET_STATUS_TONE: Record<string, StatusTone> = {
  running: "ok",
  down: "danger",
  retired: "muted",
};
const WO_STATUS_TONE: Record<string, StatusTone> = {
  open: "danger",
  in_progress: "warn",
  done: "ok",
  cancelled: "muted",
};
const PM_STATUS_TONE: Record<string, StatusTone> = {
  upcoming: "muted",
  due: "warn",
  overdue: "danger",
  done: "ok",
  skipped: "muted",
};

export function StatusChip({
  kind,
  status,
}: {
  kind: "asset" | "wo" | "pm";
  status: string;
}) {
  const map =
    kind === "asset"
      ? ASSET_STATUS_TONE
      : kind === "wo"
        ? WO_STATUS_TONE
        : PM_STATUS_TONE;
  const label = status.replace(/_/g, " ");
  return (
    <Badge tone={map[status] ?? "muted"} dot>
      {label}
    </Badge>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-graphite/[0.08] pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-graphite">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm text-graphite/60">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex flex-shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-safety/10 text-safety">
        {icon ?? <DefaultEmptyIcon />}
      </div>
      <div className="text-lg font-semibold text-graphite">{title}</div>
      <p className="max-w-sm text-sm leading-relaxed text-graphite/60">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function DefaultEmptyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden
    >
      <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7" />
    </svg>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "dark";
}) {
  const cls =
    variant === "secondary"
      ? "btn-secondary"
      : variant === "dark"
        ? "btn-dark"
        : "btn-primary";
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Small uppercase eyebrow label used above cards and section groups. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="eyebrow mb-3">{children}</h2>;
}
