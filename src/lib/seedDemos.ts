import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { recomputeInsights } from "./insights";
import { defaultSymptomChips } from "./businessTypes";
import {
  DEMO_LABOR_RATE,
  DEMO_PROFILES,
  WO_TEMPLATE,
  demoCredentials,
  type AssetRole,
  type DemoProfile,
} from "./demoOrgs";

// ---------------------------------------------------------------------------
// Idempotent seeding of the per-industry demo orgs (see demoOrgs.ts). Called on
// production/staging startup via instrumentation.ts, and by `npm run seed:demos`.
//
// Each org is created only if its slug is missing. Set DEMO_RESEED=true to wipe
// and rebuild them (relative dates otherwise drift over months).
// ---------------------------------------------------------------------------

const publicId = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 10);
const labor = (hours: number) => Math.round(hours * DEMO_LABOR_RATE);

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 86_400_000);
}

async function seedProfile(profile: DemoProfile): Promise<string> {
  const { email, password } = demoCredentials(profile.slug);

  const org = await prisma.organization.create({
    data: {
      name: profile.orgName,
      slug: profile.orgSlug,
      businessType: profile.type,
      city: profile.city,
      timezone: profile.timezone,
      laborRateCents: DEMO_LABOR_RATE,
      plan: "active",
      currentPeriodEndsAt: daysFromNow(20),
      symptomChips: defaultSymptomChips(profile.type),
    },
  });

  // Three monthly renewals; the latest keeps the org paid through +20 days so
  // the demo login never hits the paywall.
  await prisma.subscriptionPayment.createMany({
    data: [70, 40, 10].map((start, i) => ({
      orgId: org.id,
      interval: "monthly" as const,
      amountCents: 4900,
      periodStart: daysAgo(start),
      periodEnd: i === 2 ? daysFromNow(20) : daysAgo([40, 10][i]!),
      paidAt: daysAgo(start),
      method: "Bank transfer",
    })),
  });

  const passwordHash = await bcrypt.hash(password, 10);
  const owner = await prisma.user.create({
    data: {
      orgId: org.id,
      email,
      name: profile.owner.name,
      role: "owner",
      passwordHash,
      emailVerified: new Date(),
    },
  });
  const tech = await prisma.user.create({
    data: {
      orgId: org.id,
      email: `tech.${profile.slug}@uptimehq.app`,
      name: profile.tech.name,
      role: "tech",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  // --- Assets ---------------------------------------------------------------
  const assetIds = {} as Record<AssetRole, { id: string; name: string }>;
  for (const role of Object.keys(profile.assets) as AssetRole[]) {
    const def = profile.assets[role];
    const a = await prisma.asset.create({
      data: {
        orgId: org.id,
        publicId: publicId(),
        name: def.name,
        category: def.category,
        location: def.location,
        purchaseCostCents: def.costCents,
        purchaseDate: daysAgo(900),
        isComplianceTracked: role === "compliance" ? profile.complianceTracked : false,
        status: "running",
      },
    });
    assetIds[role] = { id: a.id, name: a.name };
  }

  // --- Work orders (WO_TEMPLATE × industry copy) ----------------------------
  for (let i = 0; i < WO_TEMPLATE.length; i++) {
    const slot = WO_TEMPLATE[i]!;
    const copy = profile.workOrders[i]!;
    const status = slot.status ?? "done";
    const openedAt = daysAgo(slot.openedDaysAgo);
    await prisma.workOrder.create({
      data: {
        orgId: org.id,
        assetId: assetIds[slot.role].id,
        number: i + 1,
        title: copy.title,
        symptom: copy.symptom ?? null,
        status,
        priority: slot.priority ?? "normal",
        reportedByName: slot.openedDaysAgo < 100 ? tech.name : owner.name,
        assignedToUserId: status === "done" ? tech.id : null,
        partsCostCents: slot.parts,
        laborHours: slot.laborHours,
        laborCostCents: labor(slot.laborHours),
        downtimeHours: slot.downtime,
        openedAt,
        closedAt: status === "done" ? daysAgo(slot.openedDaysAgo - 1) : null,
      },
    });
  }
  // The one open WO sits on assetC — reflect it in the asset status.
  await prisma.asset.update({
    where: { id: assetIds.assetC.id },
    data: { status: "down" },
  });

  // --- PM schedules + tasks -------------------------------------------------
  // assetA: overdue (fires overdue_pm_risk).
  const overduePm = await prisma.pMSchedule.create({
    data: {
      orgId: org.id,
      assetId: assetIds.assetA.id,
      taskName: profile.pm.overdue.taskName,
      instructions: profile.pm.overdue.instructions,
      triggerType: "time",
      intervalDays: 90,
      lastCompletedAt: daysAgo(100),
    },
  });
  await prisma.pMTask.create({
    data: { orgId: org.id, scheduleId: overduePm.id, dueAt: daysAgo(10), status: "overdue" },
  });

  // assetB: due this week.
  const dueSoonPm = await prisma.pMSchedule.create({
    data: {
      orgId: org.id,
      assetId: assetIds.assetB.id,
      taskName: profile.pm.dueSoon.taskName,
      triggerType: "time",
      intervalDays: 30,
      lastCompletedAt: daysAgo(27),
    },
  });
  await prisma.pMTask.create({
    data: { orgId: org.id, scheduleId: dueSoonPm.id, dueAt: daysFromNow(3), status: "due" },
  });

  // compliance: meter-based service + a time-based certification PM.
  const meterPm = await prisma.pMSchedule.create({
    data: {
      orgId: org.id,
      assetId: assetIds.compliance.id,
      taskName: profile.pm.meter.taskName,
      triggerType: "meter",
      meterIntervalUnits: profile.pm.meter.intervalUnits,
      meterUnitLabel: profile.pm.meter.unitLabel,
      lastCompletedMeter: profile.pm.meter.lastCompletedMeter,
      lastCompletedAt: daysAgo(120),
    },
  });
  await prisma.pMTask.create({
    data: { orgId: org.id, scheduleId: meterPm.id, dueMeter: profile.pm.meter.dueMeter, status: "upcoming" },
  });
  const certPm = await prisma.pMSchedule.create({
    data: {
      orgId: org.id,
      assetId: assetIds.compliance.id,
      taskName: profile.pm.cert.taskName,
      triggerType: "time",
      intervalDays: 365,
      lastCompletedAt: daysAgo(40),
    },
  });
  await prisma.pMTask.create({
    data: { orgId: org.id, scheduleId: certPm.id, dueAt: daysFromNow(325), status: "upcoming" },
  });
  await prisma.pMTask.create({
    data: {
      orgId: org.id,
      scheduleId: certPm.id,
      status: "done",
      completedAt: daysAgo(40),
      completedByName: tech.name,
      notes: profile.pm.cert.notes,
    },
  });

  // --- Meter readings on the compliance asset -------------------------------
  for (const r of profile.pm.meter.readings) {
    await prisma.meterReading.create({
      data: {
        assetId: assetIds.compliance.id,
        value: r.value,
        unitLabel: profile.pm.meter.unitLabel,
        enteredByName: tech.name,
        readAt: daysAgo(r.daysAgo),
      },
    });
  }

  // --- Certificate expiring soon (fires cert_expiring) ----------------------
  await prisma.assetDocument.create({
    data: {
      assetId: assetIds.compliance.id,
      title: profile.certDocTitle,
      kind: "certificate",
      fileUrl: "/api/files/seed/placeholder.pdf",
      expiresAt: daysFromNow(20),
    },
  });

  // --- Activity feed --------------------------------------------------------
  await prisma.activityLog.createMany({
    data: profile.activity.map((a) => ({
      orgId: org.id,
      actorName: a.actor === "owner" ? owner.name : tech.name,
      verb: a.verb,
      subject: a.subject,
      createdAt: daysAgo(a.daysAgo),
    })),
  });

  const insights = await recomputeInsights(org.id);
  return `${profile.orgName} — ${email} · ${WO_TEMPLATE.length} WOs, ${insights} insights`;
}

/**
 * Seed all demo orgs. Idempotent: an org is (re)built only when missing, or when
 * `reseed` is true (DEMO_RESEED=true). Per-profile failures are logged, not
 * thrown, so one bad profile never blocks the others (or server startup).
 */
export async function seedDemoOrgs(
  opts: { reseed?: boolean } = {},
): Promise<{ created: number; skipped: number }> {
  const reseed = opts.reseed ?? process.env.DEMO_RESEED === "true";
  let created = 0;
  let skipped = 0;

  for (const profile of DEMO_PROFILES) {
    try {
      const existing = await prisma.organization.findUnique({
        where: { slug: profile.orgSlug },
        select: { id: true },
      });
      if (existing) {
        if (!reseed) {
          skipped++;
          continue;
        }
        await prisma.organization.delete({ where: { id: existing.id } });
      }
      const summary = await seedProfile(profile);
      created++;
      console.log(`[seed:demos] ✓ ${summary}`);
    } catch (err) {
      console.error(`[seed:demos] ✗ ${profile.orgSlug} failed`, err);
    }
  }

  console.log(`[seed:demos] done — ${created} created, ${skipped} already present`);
  return { created, skipped };
}
