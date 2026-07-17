import Link from "next/link";
import type { Insight } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { formatDateTime } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { recalculateAction, dismissInsightAction } from "./actions";

const SEVERITY_RANK: Record<string, number> = { critical: 3, warn: 2, info: 1 };

const SEVERITY_STYLE: Record<
  string,
  { border: string; icon: string; iconBg: string; label: string; labelCls: string }
> = {
  critical: {
    border: "border-l-danger",
    icon: "!",
    iconBg: "bg-danger text-white",
    label: "Critical",
    labelCls: "text-danger",
  },
  warn: {
    border: "border-l-warn",
    icon: "▲",
    iconBg: "bg-warn text-white",
    label: "Warning",
    labelCls: "text-warn",
  },
  info: {
    border: "border-l-ok",
    icon: "✓",
    iconBg: "bg-ok text-white",
    label: "Info",
    labelCls: "text-ok",
  },
};

function actionLink(insight: Insight): { href: string; label: string } | null {
  switch (insight.actionType) {
    case "create_wo":
      return {
        href: `/work-orders/new?asset=${insight.assetId ?? ""}&title=${encodeURIComponent(
          "Root-cause investigation",
        )}&priority=high`,
        label: "Create work order",
      };
    case "view_schedule":
      return { href: "/schedule", label: "View schedule" };
    case "export_pdf":
      return insight.assetId
        ? { href: `/assets/${insight.assetId}/export.pdf`, label: "Export PDF" }
        : null;
    default:
      return null;
  }
}

export default async function InsightsPage() {
  const { org } = await requireAuth();
  const insights = await tenantDb(org.id).insight.findMany({
    where: { dismissedAt: null },
  });
  insights.sort(
    (a, b) =>
      (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0) ||
      b.computedAt.getTime() - a.computedAt.getTime(),
  );

  const lastComputed = insights[0]?.computedAt;

  return (
    <div>
      <PageHeader
        title="Insights"
        subtitle="Plain-English signals about where your money and downtime are going."
        action={
          <form action={recalculateAction}>
            <SubmitButton className="btn-secondary" pendingText="Recalculating…">
              Recalculate
            </SubmitButton>
          </form>
        }
      />

      {insights.length === 0 ? (
        <EmptyState
          title="No insights right now"
          body="That's good news — nothing is flagging. As work orders, downtime and PMs accumulate, UptimeHQ surfaces what needs attention here. Hit Recalculate to check now."
          icon={
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
              <path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      ) : (
        <div className="space-y-3">
          {lastComputed && (
            <p className="text-xs text-content/40">
              Last recalculated {formatDateTime(lastComputed, org.timezone)}
            </p>
          )}
          {insights.map((insight) => {
            const style =
              SEVERITY_STYLE[insight.severity] ?? SEVERITY_STYLE.info!;
            const action = actionLink(insight);
            const dismiss = dismissInsightAction.bind(null, insight.id);
            return (
              <div
                key={insight.id}
                className={`card border-l-4 p-5 transition-shadow hover:shadow-card-hover ${style.border}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${style.iconBg}`}
                  >
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-[11px] font-bold uppercase tracking-wider ${style.labelCls}`}
                    >
                      {style.label}
                    </div>
                    <h3 className="mt-0.5 text-base font-semibold text-content">
                      {insight.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-content/70">
                      {insight.body}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      {action && (
                        <Link href={action.href} className="btn-primary">
                          {action.label}
                        </Link>
                      )}
                      <form action={dismiss}>
                        <button className="btn-ghost text-sm">Dismiss</button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
