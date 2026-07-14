import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import {
  dashboardStats,
  costByAsset,
  monthlySpend,
  recentActivity,
  topInsight,
} from "@/lib/analytics";
import { formatMoney, formatHours, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import {
  CostByAssetChart,
  MonthlySpendChart,
} from "@/components/DashboardCharts";

const SEVERITY_BANNER: Record<string, string> = {
  critical: "bg-danger/10 border-danger/30 text-danger",
  warn: "bg-warn/10 border-warn/30 text-warn",
  info: "bg-safety/10 border-safety/30 text-safety",
};

export default async function DashboardPage() {
  const { org, user } = await requireAuth();
  const [stats, costs, monthly, activity, insight] = await Promise.all([
    dashboardStats(org.id),
    costByAsset(org.id),
    monthlySpend(org.id),
    recentActivity(org.id),
    topInsight(org.id),
  ]);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle={`${org.name} · last 90 days`}
      />

      {insight && (
        <Link
          href="/insights"
          className={`mb-6 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
            SEVERITY_BANNER[insight.severity] ?? SEVERITY_BANNER.info
          }`}
        >
          <div>
            <div className="text-sm font-semibold">{insight.title}</div>
            <div className="mt-0.5 text-sm opacity-90">{insight.body}</div>
          </div>
          <span className="shrink-0 text-sm font-semibold">View →</span>
        </Link>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Downtime (90d)"
          value={formatHours(stats.downtimeHours90d)}
        />
        <StatCard
          label="Maintenance spend (90d)"
          value={formatMoney(stats.spendCents90d)}
        />
        <StatCard
          label="PM compliance (90d)"
          value={
            stats.pmCompliance === null
              ? "—"
              : `${Math.round(stats.pmCompliance * 100)}%`
          }
        />
        <StatCard
          label="Open work orders"
          value={String(stats.openWorkOrders)}
          href="/work-orders?status=open"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Cost by asset (90d)
          </h2>
          <CostByAssetChart data={costs} />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite/60">
            Monthly spend (6 months)
          </h2>
          <MonthlySpendChart data={monthly} />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite/60">
          Recent activity
        </h2>
        {activity.length === 0 ? (
          <p className="text-sm text-graphite/50">
            Activity shows up here as your team logs work.
          </p>
        ) : (
          <ul className="divide-y divide-graphite/5">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 py-2.5 text-sm"
              >
                <span className="text-graphite">
                  <span className="font-medium">{a.actorName}</span> {a.verb}{" "}
                  <span className="text-graphite/70">{a.subject}</span>
                </span>
                <span className="shrink-0 text-xs text-graphite/40">
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

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="card h-full p-4 transition-shadow hover:shadow-md">
      <div className="text-xs uppercase tracking-wide text-graphite/50">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-graphite">
        {value}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
