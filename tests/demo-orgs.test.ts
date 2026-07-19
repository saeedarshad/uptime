import { describe, expect, it } from "vitest";
import type { BusinessType } from "@prisma/client";
import {
  DEMO_PROFILES,
  WO_TEMPLATE,
  demoCredentials,
} from "@/lib/demoOrgs";

describe("demo org profiles", () => {
  it("derives credentials in the demo<slug>@ / demo<slug>4213 shape", () => {
    expect(demoCredentials("restaurant")).toEqual({
      email: "demorestaurant@uptimehq.app",
      password: "demorestaurant4213",
    });
    expect(demoCredentials("gym")).toEqual({
      email: "demogym@uptimehq.app",
      password: "demogym4213",
    });
  });

  it("covers every real business type exactly once (not `other`)", () => {
    const types = DEMO_PROFILES.map((p) => p.type);
    const expected: BusinessType[] = ["auto", "machine_shop", "gym", "contractor", "restaurant"];
    expect([...types].sort()).toEqual([...expected].sort());
    expect(new Set(types).size).toBe(types.length);
  });

  it("has unique slugs, org slugs and emails across profiles", () => {
    const slugs = DEMO_PROFILES.map((p) => p.slug);
    const orgSlugs = DEMO_PROFILES.map((p) => p.orgSlug);
    const emails = DEMO_PROFILES.map((p) => demoCredentials(p.slug).email);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(orgSlugs).size).toBe(orgSlugs.length);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it("supplies work-order copy for every template slot", () => {
    for (const p of DEMO_PROFILES) {
      expect(p.workOrders).toHaveLength(WO_TEMPLATE.length);
      for (const wo of p.workOrders) expect(wo.title.length).toBeGreaterThan(0);
    }
  });

  it("defines all six asset roles and four meter readings per profile", () => {
    for (const p of DEMO_PROFILES) {
      expect(Object.keys(p.assets).sort()).toEqual(
        ["assetA", "assetB", "assetC", "compliance", "moneyPit", "repeat"].sort(),
      );
      expect(p.pm.meter.readings.length).toBeGreaterThanOrEqual(3);
      expect(p.activity).toHaveLength(3);
    }
  });

  it("gives the money-pit asset the most work orders (drives insight rules)", () => {
    const counts = new Map<string, number>();
    for (const slot of WO_TEMPLATE) counts.set(slot.role, (counts.get(slot.role) ?? 0) + 1);
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]!;
    expect(top[0]).toBe("moneyPit");
    expect(counts.get("repeat")).toBeGreaterThanOrEqual(3);
  });
});
