import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import {
  dashboardStats,
  costByAsset,
  monthlySpend,
  recentActivity,
  topInsight,
} from "@/lib/analytics";
import { formatMoney, formatHours, formatDate } from "@/lib/format";
import { PageHeader, SectionTitle, StatCard, LinkButton } from "@/components/ui";
import { GettingStarted, type OnboardingStep } from "@/components/GettingStarted";
import {
  CostByAssetChart,
  MonthlySpendChart,
} from "@/components/DashboardCharts";

const SEVERITY_BANNER: Record<
  string,
  { wrap: string; icon: string; iconPath: string }
> = {
  critical: {
    wrap: "bg-danger/[0.06] border-danger/20 hover:border-danger/35",
    icon: "text-danger bg-danger/10",
    iconPath: "M12 9v4m0 4h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z",
  },
  warn: {
    wrap: "bg-warn/[0.06] border-warn/20 hover:border-warn/35",
    icon: "text-warn bg-warn/10",
    iconPath: "M12 9v4m0 4h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z",
  },
  info: {
    wrap: "bg-safety/[0.06] border-safety/20 hover:border-safety/35",
    icon: "text-safety bg-safety/10",
    iconPath: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  },
};

const STAT_ICONS = {
  downtime: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  spend: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  compliance: "M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z",
  wo: "M4 6h16M4 12h16M4 18h10",
};

export default async function DashboardPage() {
  const { org, user } = await requireAuth();
  const td = tenantDb(org.id);
  const [stats, costs, monthly, activity, insight, assetCount, woCount, userCount, inviteCount] =
    await Promise.all([
      dashboardStats(org.id),
      costByAsset(org.id),
      monthlySpend(org.id),
      recentActivity(org.id),
      topInsight(org.id),
      td.asset.count(),
      td.workOrder.count(),
      td.user.count(),
      td.invite.count({ where: { acceptedAt: null } }),
    ]);

  const onboarding: OnboardingStep[] = [
    {
      label: "Add your first asset",
      hint: "The equipment you want to track — lifts, machines, HVAC.",
      href: "/assets/new",
      done: assetCount > 0,
    },
    {
      label: "Print & post QR labels",
      hint: "Techs scan a label to report problems — no login needed.",
      href: "/assets/labels",
      done: assetCount > 0 && woCount > 0,
    },
    {
      label: "Invite your team",
      hint: "Unlimited users on every plan.",
      href: "/settings",
      done: userCount > 1 || inviteCount > 0,
    },
    {
      label: "Log your first work order",
      hint: "Record a repair to start tracking cost and downtime.",
      href: "/work-orders/new",
      done: woCount > 0,
    },
  ];
  const setupComplete = onboarding.every((s) => s.done);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        subtitle={`${org.name} · trailing 90 days`}
        action={
          <>
            <LinkButton href="/work-orders/new">New work order</LinkButton>
            <LinkButton href="/assets/new" variant="secondary">
              Add asset
            </LinkButton>
          </>
        }
      />

      {!setupComplete && <GettingStarted steps={onboarding} />}

      {insight &&
        (() => {
          const sev = SEVERITY_BANNER[insight.severity] ?? SEVERITY_BANNER.info!;
          return (
        <Link
          href="/insights"
          className={`group mb-6 flex items-center justify-between gap-4 rounded-xl border px-5 py-4 shadow-card transition-all hover:shadow-card-hover ${sev.wrap}`}
        >
          <div className="flex items-start gap-3.5">
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${sev.icon}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d={sev.iconPath} />
              </svg>
            </span>
            <div>
              <div className="text-sm font-bold text-content">
                {insight.title}
              </div>
              <div className="mt-0.5 text-sm text-content/70">
                {insight.body}
              </div>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-content/70 transition-transform group-hover:translate-x-0.5">
            View
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
          );
        })()}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Downtime"
          value={formatHours(stats.downtimeHours90d)}
          iconPath={STAT_ICONS.downtime}
          tone="graphite"
          href="/work-orders"
        />
        <StatCard
          label="Maintenance spend"
          value={formatMoney(stats.spendCents90d)}
          iconPath={STAT_ICONS.spend}
          tone="safety"
          hint="90d"
          spark={monthly.map((m) => m.cents)}
        />
        <StatCard
          label="PM compliance"
          value={
            stats.pmCompliance === null
              ? "—"
              : `${Math.round(stats.pmCompliance * 100)}%`
          }
          iconPath={STAT_ICONS.compliance}
          tone="ok"
          href="/schedule"
        />
        <StatCard
          label="Open work orders"
          value={String(stats.openWorkOrders)}
          iconPath={STAT_ICONS.wo}
          tone="danger"
          href="/work-orders?status=open"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Cost by asset · 90d</SectionTitle>
            <Link
              href="/assets"
              className="text-xs font-semibold text-safety hover:underline"
            >
              All assets
            </Link>
          </div>
          <CostByAssetChart data={costs} />
        </div>
        <div className="card p-6">
          <SectionTitle>Monthly spend · 6 months</SectionTitle>
          <MonthlySpendChart data={monthly} />
        </div>
      </div>

      <div className="card p-6">
        <SectionTitle>Recent activity</SectionTitle>
        {activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-content/50">
            Activity shows up here as your team logs work.
          </p>
        ) : (
          <ul className="-my-1 divide-y divide-content/[0.06]">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-content/[0.06] text-[11px] font-bold text-content/60">
                    {a.actorName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-content">
                    <span className="font-semibold">{a.actorName}</span> {a.verb}{" "}
                    <span className="text-content/70">{a.subject}</span>
                  </span>
                </div>
                <span className="shrink-0 text-xs text-content/40">
                  {formatDate(a.createdAt, org.timezone)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

