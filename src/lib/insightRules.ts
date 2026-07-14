import { formatMoney, formatHours } from "./format";

// --- Types ------------------------------------------------------------------

export type Severity = "info" | "warn" | "critical";
export type ActionType = "create_wo" | "view_schedule" | "export_pdf" | "none";

export interface AssetSnapshot {
  id: string;
  name: string;
  purchaseCostCents: number | null;
  isComplianceTracked: boolean;
  cost90dCents: number;
  cost365dCents: number;
  downtime90dHours: number;
  woCount180d: number;
  woCount90d: number;
  hasOverduePm: boolean;
  monthsOfHistory: number;
}

export interface ExpiringDoc {
  docId: string;
  assetId: string;
  assetName: string;
  title: string;
  daysRemaining: number;
}

export interface InsightContext {
  now: Date;
  laborRateCents: number;
  assets: AssetSnapshot[];
  medianCost90dCents: number;
  orgDowntime90dHours: number;
  /** Spend (cents) for the last complete calendar months, chronological. */
  monthlySpendCents: { label: string; cents: number }[];
  overduePmCount: number;
  expiringDocs: ExpiringDoc[];
}

export interface InsightCandidate {
  ruleKey: string;
  assetId: string | null;
  severity: Severity;
  title: string;
  body: string;
  actionType: ActionType;
  dedupeKey: string;
}

// --- Constants --------------------------------------------------------------

const MIN_R1_COST_CENTS = 50_000; // $500 floor for the "3× median" branch
const R1_MEDIAN_MULTIPLE = 3;
const R1_PURCHASE_FRACTION = 0.5;
const R2_MIN_WO_180D = 3;
const R3_RATIO_MIN = 1.5;
const R3_SAMPLE_MIN = 3;
const R5_SHARE = 0.4;
const R5_MIN_HOURS = 10;
const R6_DAYS = 30;
const R7_MIN_MONTHS = 6;

function pricedDowntime(hours: number, rateCents: number): number {
  return Math.round(hours * rateCents);
}

// --- Rules ------------------------------------------------------------------

/** R1 — repair vs replace (critical). */
export function ruleRepairVsReplace(ctx: InsightContext): InsightCandidate[] {
  const out: InsightCandidate[] = [];
  for (const a of ctx.assets) {
    const byPurchase =
      a.purchaseCostCents !== null &&
      a.purchaseCostCents > 0 &&
      a.cost365dCents >= a.purchaseCostCents * R1_PURCHASE_FRACTION;
    const byMedian =
      ctx.medianCost90dCents > 0 &&
      a.cost90dCents >= ctx.medianCost90dCents * R1_MEDIAN_MULTIPLE &&
      a.cost90dCents >= MIN_R1_COST_CENTS;
    if (!byPurchase && !byMedian) continue;

    const parts: string[] = [
      `${a.name} has cost ${formatMoney(a.cost90dCents)} in 90 days`,
    ];
    if (ctx.medianCost90dCents > 0) {
      const mult = Math.round(a.cost90dCents / ctx.medianCost90dCents);
      if (mult >= 2) parts.push(`${mult}× your shop average`);
    }
    let body = parts.join(" — ");
    if (a.downtime90dHours > 0) {
      body += ` — plus ${formatHours(a.downtime90dHours)} of downtime (~${formatMoney(
        pricedDowntime(a.downtime90dHours, ctx.laborRateCents),
      )} at your labor rate)`;
    }
    body += ". Worth deciding whether to keep repairing it.";

    out.push({
      ruleKey: "repair_vs_replace",
      assetId: a.id,
      severity: "critical",
      title: `Repair vs. replace: ${a.name}`,
      body,
      actionType: "export_pdf",
      dedupeKey: `repair_vs_replace:${a.id}`,
    });
  }
  return out;
}

/** R2 — repeat failure (warn). */
export function ruleRepeatFailure(ctx: InsightContext): InsightCandidate[] {
  return ctx.assets
    .filter((a) => a.woCount180d >= R2_MIN_WO_180D)
    .map((a) => ({
      ruleKey: "repeat_failure",
      assetId: a.id,
      severity: "warn" as const,
      title: `Recurring failures: ${a.name}`,
      body: `${a.name} has had ${a.woCount180d} work orders in the last 180 days. A root-cause check now could stop the cycle.`,
      actionType: "create_wo" as const,
      dedupeKey: `repeat_failure:${a.id}`,
    }));
}

/** R3 — overdue PM risk (warn), with optional breakdown comparison. */
export function ruleOverduePmRisk(ctx: InsightContext): InsightCandidate[] {
  if (ctx.overduePmCount < 1) return [];

  const withPm = ctx.assets.filter((a) => a.hasOverduePm);
  const withoutPm = ctx.assets.filter((a) => !a.hasOverduePm);
  const sum = (xs: AssetSnapshot[]) =>
    xs.reduce((n, a) => n + a.woCount90d, 0);
  const avg = (xs: AssetSnapshot[]) =>
    xs.length ? sum(xs) / xs.length : 0;

  let body = `You have ${ctx.overduePmCount} preventive-maintenance task${
    ctx.overduePmCount === 1 ? "" : "s"
  } overdue. Skipping PMs is the fastest way to turn a $50 job into a $500 breakdown.`;

  const avgWith = avg(withPm);
  const avgWithout = avg(withoutPm);
  if (
    withPm.length > 0 &&
    withoutPm.length > 0 &&
    avgWithout > 0 &&
    sum(withPm) >= R3_SAMPLE_MIN &&
    avgWith / avgWithout >= R3_RATIO_MIN
  ) {
    const ratio = (avgWith / avgWithout).toFixed(1);
    body += ` Assets with overdue PMs have averaged ${ratio}× more breakdowns this quarter.`;
  }

  return [
    {
      ruleKey: "overdue_pm_risk",
      assetId: null,
      severity: "warn",
      title: "Overdue preventive maintenance",
      body,
      actionType: "view_schedule",
      dedupeKey: "overdue_pm_risk",
    },
  ];
}

/** R4 — rising spend (warn). */
export function ruleRisingSpend(ctx: InsightContext): InsightCandidate[] {
  const m = ctx.monthlySpendCents;
  if (m.length < 3) return [];
  const last3 = m.slice(-3);
  const increasing =
    last3[0]!.cents < last3[1]!.cents &&
    last3[1]!.cents < last3[2]!.cents &&
    last3[0]!.cents > 0;
  if (!increasing) return [];

  const nums = last3
    .map((x) => `${x.label} ${formatMoney(x.cents)}`)
    .join(" → ");
  return [
    {
      ruleKey: "rising_spend",
      assetId: null,
      severity: "warn",
      title: "Maintenance spend is climbing",
      body: `Your maintenance spend rose three months running: ${nums}. Worth a look at which assets are driving it.`,
      actionType: "none",
      dedupeKey: "rising_spend",
    },
  ];
}

/** R5 — downtime hotspot (warn). */
export function ruleDowntimeHotspot(ctx: InsightContext): InsightCandidate[] {
  if (ctx.orgDowntime90dHours <= 0) return [];
  const out: InsightCandidate[] = [];
  for (const a of ctx.assets) {
    const share = a.downtime90dHours / ctx.orgDowntime90dHours;
    if (share > R5_SHARE && a.downtime90dHours >= R5_MIN_HOURS) {
      const pct = Math.round(share * 100);
      const priced = pricedDowntime(a.downtime90dHours, ctx.laborRateCents);
      out.push({
        ruleKey: "downtime_hotspot",
        assetId: a.id,
        severity: "warn",
        title: `Downtime hotspot: ${a.name}`,
        body: `${a.name} accounts for ${pct}% of your shop's downtime — ${formatHours(
          a.downtime90dHours,
        )} in 90 days, about ${formatMoney(priced)} at your labor rate.`,
        actionType: "export_pdf",
        dedupeKey: `downtime_hotspot:${a.id}`,
      });
    }
  }
  return out;
}

/** R6 — certificate expiring (critical). */
export function ruleCertExpiring(ctx: InsightContext): InsightCandidate[] {
  return ctx.expiringDocs
    .filter((d) => d.daysRemaining <= R6_DAYS)
    .map((d) => {
      const when =
        d.daysRemaining < 0
          ? `expired ${Math.abs(d.daysRemaining)} day${
              Math.abs(d.daysRemaining) === 1 ? "" : "s"
            } ago`
          : d.daysRemaining === 0
            ? "expires today"
            : `expires in ${d.daysRemaining} day${
                d.daysRemaining === 1 ? "" : "s"
              }`;
      return {
        ruleKey: "cert_expiring",
        assetId: d.assetId,
        severity: "critical" as const,
        title: `Certificate ${d.daysRemaining < 0 ? "expired" : "expiring"}: ${d.assetName}`,
        body: `The "${d.title}" on ${d.assetName} ${when}. Renew it before your next inspection.`,
        actionType: "none" as const,
        dedupeKey: `cert_expiring:${d.docId}`,
      };
    });
}

/** R7 — audit ready (info, positive). */
export function ruleAuditReady(ctx: InsightContext): InsightCandidate[] {
  return ctx.assets
    .filter(
      (a) =>
        a.isComplianceTracked &&
        a.monthsOfHistory >= R7_MIN_MONTHS &&
        !a.hasOverduePm,
    )
    .map((a) => ({
      ruleKey: "audit_ready",
      assetId: a.id,
      severity: "info" as const,
      title: `Audit-ready: ${a.name}`,
      body: `${a.name} has a clean ${R7_MIN_MONTHS}-month maintenance record with no overdue PMs. Export the inspection-ready PDF to hand straight to an auditor.`,
      actionType: "export_pdf" as const,
      dedupeKey: `audit_ready:${a.id}`,
    }));
}

export const ALL_RULES = [
  ruleRepairVsReplace,
  ruleRepeatFailure,
  ruleOverduePmRisk,
  ruleRisingSpend,
  ruleDowntimeHotspot,
  ruleCertExpiring,
  ruleAuditReady,
];

/** Run every rule against a context and return all candidates. */
export function runRules(ctx: InsightContext): InsightCandidate[] {
  return ALL_RULES.flatMap((rule) => rule(ctx));
}
