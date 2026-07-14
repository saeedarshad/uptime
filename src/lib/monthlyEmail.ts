import { prisma } from "./prisma";
import { computeCompliance } from "./pm";
import { sendEmail } from "./email";
import { appUrl } from "./qr";
import { formatMoney, formatHours } from "./format";

interface MonthWindow {
  start: Date;
  end: Date;
}

function monthWindow(now: Date, monthsBack: number): MonthWindow {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack, 1),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsBack + 1, 1),
  );
  return { start, end };
}

async function windowTotals(orgId: string, w: MonthWindow) {
  const agg = await prisma.workOrder.aggregate({
    where: {
      orgId,
      status: { not: "cancelled" },
      openedAt: { gte: w.start, lt: w.end },
    },
    _sum: { partsCostCents: true, laborCostCents: true, downtimeHours: true },
  });
  return {
    spendCents: (agg._sum.partsCostCents ?? 0) + (agg._sum.laborCostCents ?? 0),
    downtimeHours: Number(agg._sum.downtimeHours ?? 0),
  };
}

function delta(current: number, prev: number): string {
  if (prev === 0) return current === 0 ? "no change" : "new";
  const pct = Math.round(((current - prev) / prev) * 100);
  if (pct === 0) return "flat";
  return pct > 0 ? `▲ ${pct}%` : `▼ ${Math.abs(pct)}%`;
}

export interface MonthlyReport {
  orgName: string;
  reportLabel: string;
  spend: { current: number; prev: number };
  downtime: { current: number; prev: number };
  pmCompliance: number | null;
  openWorkOrders: number;
  topInsights: { title: string; body: string }[];
}

/** Build the monthly report comparing the just-ended month to the one before. */
export async function buildMonthlyReport(
  orgId: string,
  now: Date = new Date(),
): Promise<MonthlyReport> {
  const reportW = monthWindow(now, 1); // last complete month
  const priorW = monthWindow(now, 2);

  const [org, current, prev, pmTasks, openWorkOrders, insights] =
    await Promise.all([
      prisma.organization.findUniqueOrThrow({ where: { id: orgId } }),
      windowTotals(orgId, reportW),
      windowTotals(orgId, priorW),
      prisma.pMTask.findMany({
        where: { orgId },
        select: { status: true, dueAt: true, completedAt: true },
      }),
      prisma.workOrder.count({
        where: { orgId, status: { in: ["open", "in_progress"] } },
      }),
      prisma.insight.findMany({ where: { orgId, dismissedAt: null } }),
    ]);

  const rank: Record<string, number> = { critical: 3, warn: 2, info: 1 };
  const topInsights = insights
    .sort((a, b) => (rank[b.severity] ?? 0) - (rank[a.severity] ?? 0))
    .slice(0, 3)
    .map((i) => ({ title: i.title, body: i.body }));

  return {
    orgName: org.name,
    reportLabel: reportW.start.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    spend: { current: current.spendCents, prev: prev.spendCents },
    downtime: { current: current.downtimeHours, prev: prev.downtimeHours },
    pmCompliance: computeCompliance(pmTasks, reportW.end, 90),
    openWorkOrders,
    topInsights,
  };
}

function renderHtml(r: MonthlyReport): string {
  const stat = (label: string, value: string, sub: string) => `
    <td style="padding:10px 14px;border:1px solid #e3e3df;vertical-align:top">
      <div style="font-size:11px;text-transform:uppercase;color:#8a8f94;letter-spacing:.04em">${label}</div>
      <div style="font-size:22px;font-weight:700;color:#242B33;margin-top:4px">${value}</div>
      <div style="font-size:12px;color:#8a8f94;margin-top:2px">${sub}</div>
    </td>`;

  const insightsHtml =
    r.topInsights.length === 0
      ? `<p style="color:#8a8f94">No open insights — nice and quiet.</p>`
      : r.topInsights
          .map(
            (i) => `
        <div style="padding:10px 0;border-bottom:1px solid #eee">
          <div style="font-weight:600;color:#242B33">${i.title}</div>
          <div style="font-size:13px;color:#555;margin-top:2px">${i.body}</div>
        </div>`,
          )
          .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#242B33">
    <h1 style="font-size:18px">${r.orgName}</h1>
    <p style="color:#555">Your maintenance summary for <strong>${r.reportLabel}</strong>.</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr>
        ${stat("Maintenance spend", formatMoney(r.spend.current), `${delta(r.spend.current, r.spend.prev)} vs prior month`)}
        ${stat("Downtime", formatHours(r.downtime.current), `${delta(r.downtime.current, r.downtime.prev)} vs prior month`)}
      </tr>
      <tr>
        ${stat("PM compliance", r.pmCompliance === null ? "—" : `${Math.round(r.pmCompliance * 100)}%`, "last 90 days")}
        ${stat("Open work orders", String(r.openWorkOrders), "right now")}
      </tr>
    </table>
    <h2 style="font-size:15px;margin-top:20px">Top insights</h2>
    ${insightsHtml}
    <p style="margin-top:24px">
      <a href="${appUrl()}/dashboard" style="background:#E1622F;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Open your dashboard</a>
    </p>
  </div>`;
}

/** Email the monthly report to every owner/admin of the org. */
export async function sendMonthlyOwnerEmail(
  orgId: string,
  now: Date = new Date(),
): Promise<void> {
  const report = await buildMonthlyReport(orgId, now);
  const managers = await prisma.user.findMany({
    where: { orgId, role: { in: ["owner", "admin"] } },
    select: { email: true },
  });
  const html = renderHtml(report);
  await Promise.all(
    managers.map((m) =>
      sendEmail({
        to: m.email,
        subject: `${report.orgName} · ${report.reportLabel} maintenance summary`,
        html,
      }),
    ),
  );
}
