import { prisma } from "./prisma";
import { nextOccurrence, type ScheduleInput } from "./pm";
import { recomputeInsights } from "./insights";
import { sendMonthlyOwnerEmail } from "./monthlyEmail";
import { sendEmailToMany } from "./email";
import { computeSubscription, dueExpiryReminder } from "./subscription";
import { expiryReminder } from "./emailTemplates";
import { appUrl } from "./qr";
import { formatDate } from "./format";

const OPEN_STATUSES = ["upcoming", "due", "overdue"] as const;

function toScheduleInput(s: {
  triggerType: "time" | "meter";
  intervalDays: number | null;
  meterIntervalUnits: number | null;
  lastCompletedAt: Date | null;
  lastCompletedMeter: unknown;
  createdAt: Date;
}): ScheduleInput {
  return {
    triggerType: s.triggerType,
    intervalDays: s.intervalDays,
    meterIntervalUnits: s.meterIntervalUnits,
    lastCompletedAt: s.lastCompletedAt,
    lastCompletedMeter:
      s.lastCompletedMeter === null ? null : Number(s.lastCompletedMeter),
    createdAt: s.createdAt,
  };
}

/**
 * Ensure each active schedule has exactly one open PMTask reflecting its next
 * occurrence, and refresh its status (upcoming → due → overdue). Idempotent:
 * safe to run repeatedly.
 */
export async function syncPmTasksForOrg(
  orgId: string,
  now: Date = new Date(),
): Promise<{ created: number; updated: number }> {
  const schedules = await prisma.pMSchedule.findMany({
    where: { orgId, active: true },
    include: {
      pmTasks: {
        where: { status: { in: [...OPEN_STATUSES] } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  let created = 0;
  let updated = 0;
  for (const s of schedules) {
    let currentMeter: number | null = null;
    if (s.triggerType === "meter") {
      const reading = await prisma.meterReading.findFirst({
        where: { assetId: s.assetId },
        orderBy: { readAt: "desc" },
        select: { value: true },
      });
      currentMeter = reading ? Number(reading.value) : null;
    }

    const occ = nextOccurrence(toScheduleInput(s), now, currentMeter);
    if (!occ) continue;

    const open = s.pmTasks[0];
    if (!open) {
      await prisma.pMTask.create({
        data: {
          orgId,
          scheduleId: s.id,
          dueAt: occ.dueAt,
          dueMeter: occ.dueMeter,
          status: occ.status,
        },
      });
      created += 1;
    } else if (
      open.status !== occ.status ||
      open.dueAt?.getTime() !== occ.dueAt?.getTime()
    ) {
      await prisma.pMTask.update({
        where: { id: open.id },
        data: { dueAt: occ.dueAt, dueMeter: occ.dueMeter, status: occ.status },
      });
      updated += 1;
    }
  }
  return { created, updated };
}

/**
 * Mark a PM task done, advance the schedule, and spawn the next occurrence.
 * Org-scoped: throws if the task isn't in the org.
 */
export async function completePmTask(
  orgId: string,
  taskId: string,
  completedByName: string,
  notes: string | null,
  now: Date = new Date(),
): Promise<void> {
  const task = await prisma.pMTask.findFirst({
    where: { id: taskId, orgId },
    include: { schedule: true },
  });
  if (!task) throw new Error("PM task not found");
  const s = task.schedule;

  let currentMeter: number | null = null;
  if (s.triggerType === "meter") {
    const reading = await prisma.meterReading.findFirst({
      where: { assetId: s.assetId },
      orderBy: { readAt: "desc" },
      select: { value: true },
    });
    currentMeter = reading ? Number(reading.value) : null;
  }

  await prisma.$transaction(async (tx) => {
    await tx.pMTask.update({
      where: { id: task.id },
      data: { status: "done", completedAt: now, completedByName, notes },
    });
    await tx.pMSchedule.update({
      where: { id: s.id },
      data: {
        lastCompletedAt: now,
        lastCompletedMeter: currentMeter ?? s.lastCompletedMeter,
      },
    });
    if (s.active) {
      const occ = nextOccurrence(
        toScheduleInput({ ...s, lastCompletedAt: now, lastCompletedMeter: currentMeter }),
        now,
        currentMeter,
      );
      if (occ) {
        await tx.pMTask.create({
          data: {
            orgId,
            scheduleId: s.id,
            dueAt: occ.dueAt,
            dueMeter: occ.dueMeter,
            status: occ.status,
          },
        });
      }
    }
  });
}

/** Nightly digest: email owners/admins when maintenance needs attention. */
async function sendDigestForOrg(orgId: string): Promise<void> {
  const [overdue, openHighWo, org] = await Promise.all([
    prisma.pMTask.count({ where: { orgId, status: "overdue" } }),
    prisma.workOrder.count({
      where: { orgId, status: { in: ["open", "in_progress"] }, priority: "high" },
    }),
    prisma.organization.findUnique({ where: { id: orgId } }),
  ]);
  if (!org || (overdue === 0 && openHighWo === 0)) return;

  const managers = await prisma.user.findMany({
    where: { orgId, role: { in: ["owner", "admin"] } },
    select: { email: true },
  });

  const lines: string[] = [];
  if (overdue > 0) lines.push(`<li>${overdue} preventive-maintenance task(s) overdue</li>`);
  if (openHighWo > 0) lines.push(`<li>${openHighWo} high-priority work order(s) still open</li>`);

  const html = `
    <p>Good morning — here's what needs attention at ${org.name}:</p>
    <ul>${lines.join("")}</ul>
    <p><a href="${appUrl()}/dashboard">Open your dashboard</a></p>
    <p style="color:#888;font-size:12px">${formatDate(new Date(), org.timezone)}</p>
  `;
  await sendEmailToMany(
    managers.map((m) => m.email),
    {
      subject: `UptimeHQ · ${overdue + openHighWo} item(s) need attention`,
      html,
    },
  );
}

/**
 * Access-expiry reminders: 3 and 1 day(s) before a trial or paid period lapses,
 * email owners/admins. The `SubscriptionReminder` unique constraint makes this
 * idempotent — a second run the same day (or a retried cron) sends nothing.
 * Returns the number of reminder emails newly sent.
 */
async function sendExpiryRemindersForOrg(
  orgId: string,
  now: Date,
): Promise<number> {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return 0;

  const state = computeSubscription(org, now);
  if (!state.accessAllowed || state.endsAt === null) return 0;

  const threshold = dueExpiryReminder(state.daysRemaining);
  if (threshold === null) return 0;

  // Claim the (org, endsAt, threshold) slot; a duplicate throws on the unique
  // index, which means the reminder already went out — skip silently.
  try {
    await prisma.subscriptionReminder.create({
      data: { orgId, endsAt: state.endsAt, threshold },
    });
  } catch {
    return 0;
  }

  const managers = await prisma.user.findMany({
    where: { orgId, role: { in: ["owner", "admin"] } },
    select: { email: true },
  });
  const onTrial = state.status === "trialing";
  const { subject, html, text } = expiryReminder(
    org.name,
    state.endsAt,
    org.timezone,
    threshold,
    onTrial,
  );
  await sendEmailToMany(
    managers.map((m) => m.email),
    { subject, html, text },
  );
  return 1;
}

/**
 * The nightly job (run by cron or POST /api/jobs/run): sync PM tasks, recompute
 * insights, and send digests — for every org.
 */
export async function runNightlyJob(
  now: Date = new Date(),
): Promise<{
  orgs: number;
  pmCreated: number;
  pmUpdated: number;
  monthlyEmails: number;
  expiryReminders: number;
}> {
  const orgs = await prisma.organization.findMany({ select: { id: true } });
  const isFirstOfMonth = now.getUTCDate() === 1;
  let pmCreated = 0;
  let pmUpdated = 0;
  let monthlyEmails = 0;
  let expiryReminders = 0;
  for (const { id } of orgs) {
    const { created, updated } = await syncPmTasksForOrg(id, now);
    pmCreated += created;
    pmUpdated += updated;
    await recomputeInsights(id, now);
    await sendDigestForOrg(id);
    expiryReminders += await sendExpiryRemindersForOrg(id, now);
    if (isFirstOfMonth) {
      await sendMonthlyOwnerEmail(id, now);
      monthlyEmails += 1;
    }
  }
  return { orgs: orgs.length, pmCreated, pmUpdated, monthlyEmails, expiryReminders };
}
