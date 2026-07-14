import Link from "next/link";
import type { ReactNode } from "react";

type StatusTone = "ok" | "warn" | "danger" | "muted" | "info";

const TONE: Record<StatusTone, string> = {
  ok: "bg-ok/10 text-ok",
  warn: "bg-warn/10 text-warn",
  danger: "bg-danger/10 text-danger",
  muted: "bg-graphite/10 text-graphite/70",
  info: "bg-safety/10 text-safety",
};

export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}
    >
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
  return <Badge tone={map[status] ?? "muted"}>{label}</Badge>;
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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-graphite">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-graphite/60">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="text-lg font-semibold text-graphite">{title}</div>
      <p className="max-w-sm text-sm text-graphite/60">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
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
