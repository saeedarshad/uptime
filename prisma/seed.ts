import {
  PrismaClient,
  type BusinessType,
  type Priority,
  type WorkOrderStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { defaultSymptomChips } from "../src/lib/businessTypes";
import { recomputeInsights } from "../src/lib/insights";

const prisma = new PrismaClient();
const publicId = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 10);
const LABOR_RATE = 6000; // $60/hr in cents

const now = new Date();
function daysAgo(n: number): Date {
  return new Date(now.getTime() - n * 86_400_000);
}
function daysFromNow(n: number): Date {
  return new Date(now.getTime() + n * 86_400_000);
}
const labor = (hours: number) => Math.round(hours * LABOR_RATE);

/**
 * Demo org "Route 66 Auto Care" — the sales-demo + local dev environment.
 * Data is shaped so the insight rules (R1–R7) fire once the engine runs.
 */
async function main() {
  console.log("Seeding demo org…");
  const existing = await prisma.organization.findUnique({
    where: { slug: "route-66-auto-care" },
  });
  if (existing) {
    await prisma.organization.delete({ where: { id: existing.id } });
    console.log("  cleared previous demo org");
  }

  const businessType: BusinessType = "auto";
  const org = await prisma.organization.create({
    data: {
      name: "Route 66 Auto Care",
      slug: "route-66-auto-care",
      businessType,
      city: "Broken Arrow, OK",
      timezone: "America/Chicago",
      laborRateCents: LABOR_RATE,
      plan: "active",
      currentPeriodEndsAt: daysFromNow(20),
      symptomChips: defaultSymptomChips(businessType),
    },
  });

  // Three monthly renewals; the latest covers "now" (paid through +20 days).
  await prisma.subscriptionPayment.createMany({
    data: [
      {
        orgId: org.id,
        interval: "monthly",
        amountCents: 4900,
        periodStart: daysAgo(70),
        periodEnd: daysAgo(40),
        paidAt: daysAgo(70),
        method: "Bank transfer",
      },
      {
        orgId: org.id,
        interval: "monthly",
        amountCents: 4900,
        periodStart: daysAgo(40),
        periodEnd: daysAgo(10),
        paidAt: daysAgo(40),
        method: "Bank transfer",
      },
      {
        orgId: org.id,
        interval: "monthly",
        amountCents: 4900,
        periodStart: daysAgo(10),
        periodEnd: daysFromNow(20),
        paidAt: daysAgo(10),
        method: "Bank transfer",
      },
    ],
  });

  const owner = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "demo@uptimehq.app",
      name: "Dale Cooper",
      role: "owner",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });
  const tech = await prisma.user.create({
    data: {
      orgId: org.id,
      email: "tech@uptimehq.app",
      name: "Harry Truman",
      role: "tech",
      passwordHash: await bcrypt.hash("demo1234", 10),
    },
  });

  const assetDefs = {
    lift1: { name: "Vehicle Lift #1", category: "Lift", location: "Bay 1", cost: 480000 },
    lift2: { name: "Vehicle Lift #2", category: "Lift", location: "Bay 2", cost: 480000 },
    compressor: {
      name: "80-gal Air Compressor",
      category: "Compressor",
      location: "Utility room",
      cost: 210000,
    },
    balancer: {
      name: "Tire Balancer",
      category: "Tire equipment",
      location: "Bay 3",
      cost: 350000,
    },
    acrm: {
      name: "A/C Recovery Machine",
      category: "HVAC",
      location: "Bay 3",
      cost: 280000,
    },
    truck: {
      name: "Shop Truck F-250",
      category: "Vehicle",
      location: "Lot",
      cost: 4200000,
      compliance: true,
    },
  } as const;

  const assets: Record<string, { id: string; name: string; publicId: string }> =
    {};
  for (const [key, def] of Object.entries(assetDefs)) {
    const a = await prisma.asset.create({
      data: {
        orgId: org.id,
        publicId: publicId(),
        name: def.name,
        category: def.category,
        location: def.location,
        purchaseCostCents: def.cost,
        purchaseDate: daysAgo(900),
        isComplianceTracked: "compliance" in def ? def.compliance : false,
        status: "running",
      },
    });
    assets[key] = { id: a.id, name: a.name, publicId: a.publicId };
  }

  // --- Work orders -----------------------------------------------------------
  interface WoSpec {
    asset: keyof typeof assetDefs;
    title: string;
    symptom?: string;
    openedDaysAgo: number;
    parts: number;
    laborHours: number;
    downtime: number;
    status?: WorkOrderStatus;
    priority?: Priority;
  }

  // Costs/dates are tuned so all seven insight rules fire, and so the last
  // three complete months of spend rise (Apr < May < Jun) for rising_spend.
  const woSpecs: WoSpec[] = [
    // Vehicle Lift #2 — the money pit: 5 in last 90 days = $2,340, 31 hrs down.
    { asset: "lift2", title: "Hydraulic cylinder reseal", symptom: "Leaking", openedDaysAgo: 8, parts: 34000, laborHours: 1.0, downtime: 5, priority: "high" },
    { asset: "lift2", title: "Replace hydraulic hose", symptom: "Leaking", openedDaysAgo: 20, parts: 46000, laborHours: 1.5, downtime: 8, priority: "high" },
    { asset: "lift2", title: "Lock latch stuck", symptom: "Won't lift / lower", openedDaysAgo: 30, parts: 39000, laborHours: 1.0, downtime: 6 },
    { asset: "lift2", title: "Arm restraint gear worn", symptom: "Strange noise", openedDaysAgo: 55, parts: 40000, laborHours: 1.0, downtime: 7 },
    { asset: "lift2", title: "Pump motor overheating", symptom: "Overheating", openedDaysAgo: 82, parts: 42000, laborHours: 1.0, downtime: 5, priority: "high" },
    { asset: "lift2", title: "Annual safety recert", openedDaysAgo: 200, parts: 24000, laborHours: 1.0, downtime: 3 },

    // A/C Recovery Machine — 3 pressure faults within 180 days (repeat failure).
    { asset: "acrm", title: "Low recovery pressure", symptom: "Low pressure", openedDaysAgo: 28, parts: 15000, laborHours: 1.0, downtime: 2 },
    { asset: "acrm", title: "Pressure sensor drift", symptom: "Low pressure", openedDaysAgo: 88, parts: 12000, laborHours: 1.0, downtime: 2 },
    { asset: "acrm", title: "Compressor pressure fault", symptom: "Warning light", openedDaysAgo: 150, parts: 18000, laborHours: 1.5, downtime: 3 },

    // Others, spread across ~9 months.
    { asset: "lift1", title: "Replace cable pulley", symptom: "Strange noise", openedDaysAgo: 40, parts: 21000, laborHours: 1.0, downtime: 3 },
    { asset: "lift1", title: "Fluid top-off", openedDaysAgo: 130, parts: 6000, laborHours: 0.5, downtime: 1 },
    { asset: "compressor", title: "Drain valve replacement", symptom: "Leaking", openedDaysAgo: 60, parts: 7500, laborHours: 1.0, downtime: 1 },
    { asset: "compressor", title: "Pressure switch swap", symptom: "Won't start", openedDaysAgo: 160, parts: 8000, laborHours: 1.0, downtime: 2 },
    { asset: "balancer", title: "Calibration off", symptom: "Warning light", openedDaysAgo: 70, parts: 8000, laborHours: 1.0, downtime: 2 },
    { asset: "balancer", title: "Display flicker", symptom: "Damaged", openedDaysAgo: 210, parts: 5000, laborHours: 0.5, downtime: 1 },
    { asset: "truck", title: "Brake inspection & pads", openedDaysAgo: 220, parts: 30000, laborHours: 2.0, downtime: 0 },
    { asset: "truck", title: "Oil & filter change", openedDaysAgo: 120, parts: 8000, laborHours: 0.75, downtime: 0 },
    { asset: "truck", title: "Tire rotation", openedDaysAgo: 35, parts: 4000, laborHours: 0.5, downtime: 0 },

    // One currently-open issue (populates "open work orders" + down status).
    { asset: "balancer", title: "Wheel clamp won't grip", symptom: "Damaged", openedDaysAgo: 3, parts: 0, laborHours: 0, downtime: 0, status: "open", priority: "high" },
  ];

  let woNumber = 0;
  for (const s of woSpecs) {
    woNumber += 1;
    const status = s.status ?? "done";
    const openedAt = daysAgo(s.openedDaysAgo);
    const closedAt = status === "done" ? daysAgo(s.openedDaysAgo - 1) : null;
    await prisma.workOrder.create({
      data: {
        orgId: org.id,
        assetId: assets[s.asset]!.id,
        number: woNumber,
        title: s.title,
        symptom: s.symptom ?? null,
        status,
        priority: s.priority ?? "normal",
        reportedByName: s.openedDaysAgo < 100 ? tech.name : owner.name,
        assignedToUserId: status === "done" ? tech.id : null,
        partsCostCents: s.parts,
        laborHours: s.laborHours,
        laborCostCents: labor(s.laborHours),
        downtimeHours: s.downtime,
        openedAt,
        closedAt,
      },
    });
  }
  // Reflect the open WO in the asset status.
  await prisma.asset.update({
    where: { id: assets.balancer!.id },
    data: { status: "down" },
  });

  // --- PM schedules + tasks --------------------------------------------------
  // Lift #1 — overdue (fires overdue_pm_risk).
  const lift1Pm = await prisma.pMSchedule.create({
    data: {
      orgId: org.id,
      assetId: assets.lift1!.id,
      taskName: "Hydraulic fluid & safety check",
      instructions: "Check fluid level, inspect cables, test safety locks.",
      triggerType: "time",
      intervalDays: 90,
      lastCompletedAt: daysAgo(100),
    },
  });
  await prisma.pMTask.create({
    data: {
      orgId: org.id,
      scheduleId: lift1Pm.id,
      dueAt: daysAgo(10),
      status: "overdue",
    },
  });

  // Compressor — due this week.
  const compPm = await prisma.pMSchedule.create({
    data: {
      orgId: org.id,
      assetId: assets.compressor!.id,
      taskName: "Drain tank & replace inline filter",
      triggerType: "time",
      intervalDays: 30,
      lastCompletedAt: daysAgo(27),
    },
  });
  await prisma.pMTask.create({
    data: {
      orgId: org.id,
      scheduleId: compPm.id,
      dueAt: daysFromNow(3),
      status: "due",
    },
  });

  // Truck — meter-based oil change, and a time DOT inspection (not overdue) so
  // the compliance asset stays audit-ready (R7).
  const truckOil = await prisma.pMSchedule.create({
    data: {
      orgId: org.id,
      assetId: assets.truck!.id,
      taskName: "Oil change",
      triggerType: "meter",
      meterIntervalUnits: 5000,
      meterUnitLabel: "miles",
      lastCompletedMeter: 105000,
      lastCompletedAt: daysAgo(120),
    },
  });
  await prisma.pMTask.create({
    data: {
      orgId: org.id,
      scheduleId: truckOil.id,
      dueMeter: 110000,
      status: "upcoming",
    },
  });
  const truckDot = await prisma.pMSchedule.create({
    data: {
      orgId: org.id,
      assetId: assets.truck!.id,
      taskName: "DOT annual inspection",
      triggerType: "time",
      intervalDays: 365,
      lastCompletedAt: daysAgo(40),
    },
  });
  await prisma.pMTask.create({
    data: {
      orgId: org.id,
      scheduleId: truckDot.id,
      dueAt: daysFromNow(325),
      status: "upcoming",
    },
  });
  // A completed PM in history for the truck (shows in History tab, supports R7).
  await prisma.pMTask.create({
    data: {
      orgId: org.id,
      scheduleId: truckDot.id,
      status: "done",
      completedAt: daysAgo(40),
      completedByName: tech.name,
      notes: "Passed. Sticker renewed.",
    },
  });

  // --- Meter readings on the truck -------------------------------------------
  const readings = [
    { daysAgo: 120, value: 105000 },
    { daysAgo: 60, value: 107800 },
    { daysAgo: 20, value: 109400 },
    { daysAgo: 2, value: 109950 },
  ];
  for (const r of readings) {
    await prisma.meterReading.create({
      data: {
        assetId: assets.truck!.id,
        value: r.value,
        unitLabel: "miles",
        enteredByName: tech.name,
        readAt: daysAgo(r.daysAgo),
      },
    });
  }

  // --- Calibration-style document expiring soon (fires cert_expiring) --------
  await prisma.assetDocument.create({
    data: {
      assetId: assets.truck!.id,
      title: "Annual DOT calibration certificate",
      kind: "certificate",
      fileUrl: "/api/files/seed/placeholder.pdf",
      expiresAt: daysFromNow(20),
    },
  });

  // --- Activity feed seed ----------------------------------------------------
  await prisma.activityLog.createMany({
    data: [
      { orgId: org.id, actorName: tech.name, verb: "reported a problem on", subject: "Tire Balancer (WO-18)", createdAt: daysAgo(3) },
      { orgId: org.id, actorName: tech.name, verb: "closed", subject: "WO-1 (6 hrs downtime)", createdAt: daysAgo(9) },
      { orgId: org.id, actorName: owner.name, verb: "added asset", subject: "Shop Truck F-250", createdAt: daysAgo(30) },
    ],
  });

  // Compute insights so the demo shows them immediately (also runs nightly).
  const activeInsights = await recomputeInsights(org.id);

  console.log(
    `Seeded ${org.name}: 6 assets, ${woSpecs.length} work orders, 4 PM schedules, ${readings.length} meter readings, ${activeInsights} insights.`,
  );
  console.log("Login: demo@uptimehq.app / demo1234 (owner), tech@uptimehq.app / demo1234 (tech)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
