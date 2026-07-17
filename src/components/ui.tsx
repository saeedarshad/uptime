import Link from "next/link";
import type { ReactNode } from "react";

type StatusTone = "ok" | "warn" | "danger" | "muted" | "info";

const TONE: Record<StatusTone, string> = {
  ok: "bg-ok/10 text-ok ring-ok/20",
  warn: "bg-warn/10 text-warn ring-warn/20",
  danger: "bg-danger/10 text-danger ring-danger/20",
  muted: "bg-content/[0.07] text-content/70 ring-content/15",
  info: "bg-safety/10 text-safety ring-safety/20",
};

const DOT: Record<StatusTone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  muted: "bg-content/40",
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
  eyebrow,
  breadcrumbs,
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumbs?: { label: string; href: string }[];
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-content/[0.08] pb-5">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-content">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm text-content/60">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex flex-shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  );
}

/** Compact breadcrumb trail shown above a detail-page title. The current page
 *  is the `title` itself, so callers pass only the ancestors. */
function Breadcrumbs({ items }: { items: { label: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-content/50">
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <Link
              href={item.href}
              className="transition-colors hover:text-safety"
            >
              {item.label}
            </Link>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 text-content/30"
              aria-hidden
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </li>
        ))}
      </ol>
    </nav>
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
      <div className="text-lg font-semibold text-content">{title}</div>
      <p className="max-w-sm text-sm leading-relaxed text-content/60">{body}</p>
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

// --- KPI stat card ------------------------------------------------------------

type StatTone = "graphite" | "safety" | "ok" | "danger";

const STAT_TONE: Record<StatTone, { chip: string; spark: string }> = {
  graphite: { chip: "bg-content/[0.06] text-content", spark: "rgb(var(--content))" },
  safety: { chip: "bg-safety/10 text-safety", spark: "rgb(var(--safety))" },
  ok: { chip: "bg-ok/10 text-ok", spark: "rgb(var(--ok))" },
  danger: { chip: "bg-danger/10 text-danger", spark: "rgb(var(--danger))" },
};

/** A single KPI tile: accent-chipped icon, big value, label, and an optional
 *  server-rendered sparkline of recent history. Becomes a link when `href` set. */
export function StatCard({
  label,
  value,
  iconPath,
  tone,
  href,
  hint,
  spark,
}: {
  label: string;
  value: string;
  iconPath: string;
  tone: StatTone;
  href?: string;
  hint?: string;
  spark?: number[];
}) {
  const t = STAT_TONE[tone];
  const inner = (
    <div className={`flex h-full flex-col p-5 ${href ? "card-interactive" : "card"}`}>
      <div className="flex items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${t.chip}`}
        >
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
            <path d={iconPath} />
          </svg>
        </span>
        {href ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-content/30"
            aria-hidden
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        ) : (
          spark &&
          spark.length > 1 && <Sparkline data={spark} color={t.spark} />
        )}
      </div>
      <div className="mt-4 text-2xl font-bold tabular-nums tracking-tight text-content">
        {value}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-content/50">
          {label}
        </span>
        {hint && <span className="text-xs text-content/40">· {hint}</span>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** Pure-SVG sparkline — renders on the server, no chart library needed. */
export function Sparkline({
  data,
  color,
  width = 72,
  height = 26,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const y = (v: number) => height - ((v - min) / span) * (height - 4) - 2;
  const points = data.map((v, i) => `${(i * stepX).toFixed(1)},${y(v).toFixed(1)}`);
  const line = `M${points.join(" L")}`;
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = `spark-${Math.round(color.length * data.length)}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
