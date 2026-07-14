import { describe, it, expect } from "vitest";
import {
  ruleRepairVsReplace,
  ruleRepeatFailure,
  ruleOverduePmRisk,
  ruleRisingSpend,
  ruleDowntimeHotspot,
  ruleCertExpiring,
  ruleAuditReady,
  runRules,
  type InsightContext,
  type AssetSnapshot,
} from "./insightRules";

function asset(overrides: Partial<AssetSnapshot> = {}): AssetSnapshot {
  return {
    id: "a1",
    name: "Asset 1",
    purchaseCostCents: null,
    isComplianceTracked: false,
    cost90dCents: 0,
    cost365dCents: 0,
    downtime90dHours: 0,
    woCount180d: 0,
    woCount90d: 0,
    hasOverduePm: false,
    monthsOfHistory: 0,
    ...overrides,
  };
}

function ctx(overrides: Partial<InsightContext> = {}): InsightContext {
  return {
    now: new Date("2026-07-14T12:00:00Z"),
    laborRateCents: 6000,
    assets: [],
    medianCost90dCents: 0,
    orgDowntime90dHours: 0,
    monthlySpendCents: [],
    overduePmCount: 0,
    expiringDocs: [],
    ...overrides,
  };
}

describe("R1 repair_vs_replace", () => {
  it("fires when 365d cost >= 50% of purchase cost", () => {
    const out = ruleRepairVsReplace(
      ctx({
        assets: [
          asset({
            name: "Lift #2",
            purchaseCostCents: 480000,
            cost365dCents: 264000, // 55% of purchase
            cost90dCents: 234000,
          }),
        ],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.severity).toBe("critical");
    expect(out[0]!.body).toContain("$2,340");
  });

  it("fires when 90d cost >= 3× median (min $500) and prices downtime", () => {
    const out = ruleRepairVsReplace(
      ctx({
        medianCost90dCents: 30000,
        assets: [
          asset({
            name: "Lift #2",
            cost90dCents: 234000, // ~8× median
            downtime90dHours: 31,
          }),
        ],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.body).toContain("8× your shop average");
    expect(out[0]!.body).toContain("31 hrs");
    // 31h × $60 = $1,860
    expect(out[0]!.body).toContain("$1,860");
  });

  it("does not fire below both thresholds", () => {
    const out = ruleRepairVsReplace(
      ctx({
        medianCost90dCents: 30000,
        assets: [asset({ cost90dCents: 40000, purchaseCostCents: 500000, cost365dCents: 40000 })],
      }),
    );
    expect(out).toHaveLength(0);
  });

  it("respects the $500 floor on the median branch", () => {
    const out = ruleRepairVsReplace(
      ctx({
        medianCost90dCents: 10000,
        assets: [asset({ cost90dCents: 40000 })], // 4× median but < $500
      }),
    );
    expect(out).toHaveLength(0);
  });
});

describe("R2 repeat_failure", () => {
  it("fires at 3+ work orders in 180 days", () => {
    const out = ruleRepeatFailure(
      ctx({ assets: [asset({ name: "A/C", woCount180d: 3 })] }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.body).toContain("3 work orders");
    expect(out[0]!.actionType).toBe("create_wo");
  });
  it("does not fire at 2", () => {
    expect(
      ruleRepeatFailure(ctx({ assets: [asset({ woCount180d: 2 })] })),
    ).toHaveLength(0);
  });
});

describe("R3 overdue_pm_risk", () => {
  it("does not fire with no overdue PMs", () => {
    expect(ruleOverduePmRisk(ctx({ overduePmCount: 0 }))).toHaveLength(0);
  });
  it("fires with a generic message when comparison is weak", () => {
    const out = ruleOverduePmRisk(ctx({ overduePmCount: 2, assets: [] }));
    expect(out).toHaveLength(1);
    expect(out[0]!.body).toContain("2 preventive-maintenance tasks overdue");
    expect(out[0]!.body).not.toContain("×");
  });
  it("adds the breakdown comparison when ratio >= 1.5 and sample >= 3", () => {
    const out = ruleOverduePmRisk(
      ctx({
        overduePmCount: 1,
        assets: [
          asset({ id: "x1", hasOverduePm: true, woCount90d: 4 }),
          asset({ id: "x2", hasOverduePm: false, woCount90d: 1 }),
        ],
      }),
    );
    expect(out[0]!.body).toContain("more breakdowns this quarter");
    expect(out[0]!.body).toContain("4.0×");
  });
});

describe("R4 rising_spend", () => {
  it("fires on three strictly increasing months", () => {
    const out = ruleRisingSpend(
      ctx({
        monthlySpendCents: [
          { label: "Apr", cents: 40000 },
          { label: "May", cents: 60000 },
          { label: "Jun", cents: 90000 },
        ],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.body).toContain("Apr $400");
    expect(out[0]!.body).toContain("Jun $900");
  });
  it("does not fire when not monotonic", () => {
    expect(
      ruleRisingSpend(
        ctx({
          monthlySpendCents: [
            { label: "Apr", cents: 90000 },
            { label: "May", cents: 60000 },
            { label: "Jun", cents: 90000 },
          ],
        }),
      ),
    ).toHaveLength(0);
  });
});

describe("R5 downtime_hotspot", () => {
  it("fires when one asset is >40% of downtime and >=10 hrs", () => {
    const out = ruleDowntimeHotspot(
      ctx({
        orgDowntime90dHours: 40,
        assets: [asset({ name: "Lift #2", downtime90dHours: 31 })],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.body).toContain("78%");
    expect(out[0]!.body).toContain("$1,860");
  });
  it("does not fire below the 10-hour floor", () => {
    expect(
      ruleDowntimeHotspot(
        ctx({
          orgDowntime90dHours: 9,
          assets: [asset({ downtime90dHours: 9 })],
        }),
      ),
    ).toHaveLength(0);
  });
});

describe("R6 cert_expiring", () => {
  it("fires within 30 days and names the doc + days", () => {
    const out = ruleCertExpiring(
      ctx({
        expiringDocs: [
          {
            docId: "d1",
            assetId: "t1",
            assetName: "Shop Truck F-250",
            title: "DOT calibration",
            daysRemaining: 20,
          },
        ],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.severity).toBe("critical");
    expect(out[0]!.body).toContain("expires in 20 days");
    expect(out[0]!.body).toContain("DOT calibration");
  });
  it("phrases an already-expired doc", () => {
    const out = ruleCertExpiring(
      ctx({
        expiringDocs: [
          { docId: "d1", assetId: "t1", assetName: "Truck", title: "Cert", daysRemaining: -3 },
        ],
      }),
    );
    expect(out[0]!.body).toContain("expired 3 days ago");
  });
});

describe("R7 audit_ready", () => {
  it("fires for a compliance asset with 6+ months history and no overdue PM", () => {
    const out = ruleAuditReady(
      ctx({
        assets: [
          asset({
            name: "Truck",
            isComplianceTracked: true,
            monthsOfHistory: 7,
            hasOverduePm: false,
          }),
        ],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.severity).toBe("info");
    expect(out[0]!.actionType).toBe("export_pdf");
  });
  it("does not fire when a PM is overdue", () => {
    expect(
      ruleAuditReady(
        ctx({
          assets: [
            asset({ isComplianceTracked: true, monthsOfHistory: 7, hasOverduePm: true }),
          ],
        }),
      ),
    ).toHaveLength(0);
  });
});

describe("runRules integration", () => {
  it("fires all seven rules on a rich fixture", () => {
    const out = runRules(
      ctx({
        laborRateCents: 6000,
        medianCost90dCents: 30000,
        orgDowntime90dHours: 40,
        overduePmCount: 1,
        monthlySpendCents: [
          { label: "Apr", cents: 40000 },
          { label: "May", cents: 60000 },
          { label: "Jun", cents: 90000 },
        ],
        expiringDocs: [
          { docId: "d1", assetId: "truck", assetName: "Truck", title: "DOT cal", daysRemaining: 20 },
        ],
        assets: [
          asset({
            id: "lift2",
            name: "Lift #2",
            purchaseCostCents: 480000,
            cost90dCents: 234000,
            cost365dCents: 264000,
            downtime90dHours: 31,
            woCount180d: 5,
            woCount90d: 5,
            hasOverduePm: true,
          }),
          asset({
            id: "truck",
            name: "Truck",
            isComplianceTracked: true,
            monthsOfHistory: 8,
            hasOverduePm: false,
            woCount90d: 1,
          }),
        ],
      }),
    );
    const keys = new Set(out.map((c) => c.ruleKey));
    expect(keys).toEqual(
      new Set([
        "repair_vs_replace",
        "repeat_failure",
        "overdue_pm_risk",
        "rising_spend",
        "downtime_hotspot",
        "cert_expiring",
        "audit_ready",
      ]),
    );
  });
});
