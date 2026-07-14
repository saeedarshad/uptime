import type { PmTaskStatus } from "@prisma/client";

// Pure PM scheduling logic — no DB access, so it is straightforward to unit
// test. The job layer (jobs.ts) applies these decisions to the database.

const DAY_MS = 86_400_000;
export const DUE_WINDOW_DAYS = 7; // "due this week"

/** Next due date for a time-based schedule from its base date. */
export function timeDueDate(base: Date, intervalDays: number): Date {
  return new Date(base.getTime() + intervalDays * DAY_MS);
}

/** Classify an open time-based task by its due date. */
export function classifyByDate(
  dueAt: Date,
  now: Date,
  dueWindowDays: number = DUE_WINDOW_DAYS,
): Extract<PmTaskStatus, "upcoming" | "due" | "overdue"> {
  if (dueAt.getTime() < now.getTime()) return "overdue";
  if (dueAt.getTime() <= now.getTime() + dueWindowDays * DAY_MS) return "due";
  return "upcoming";
}

/** Classify a meter-based task by the current meter value. */
export function classifyByMeter(
  dueMeter: number,
  currentMeter: number | null,
): Extract<PmTaskStatus, "upcoming" | "due" | "overdue"> {
  if (currentMeter === null) return "upcoming";
  if (currentMeter >= dueMeter) return "overdue";
  // Within 10% of the next interval boundary counts as "due soon".
  if (currentMeter >= dueMeter * 0.9) return "due";
  return "upcoming";
}

export interface ScheduleInput {
  triggerType: "time" | "meter";
  intervalDays: number | null;
  meterIntervalUnits: number | null;
  lastCompletedAt: Date | null;
  lastCompletedMeter: number | null;
  createdAt: Date;
}

export interface NextOccurrence {
  dueAt: Date | null;
  dueMeter: number | null;
  status: Extract<PmTaskStatus, "upcoming" | "due" | "overdue">;
}

/**
 * Compute the next occurrence for a schedule. For time schedules the due date
 * is (lastCompletedAt ?? createdAt) + intervalDays. For meter schedules the
 * due meter is lastCompletedMeter + interval, classified against the current
 * reading.
 */
export function nextOccurrence(
  s: ScheduleInput,
  now: Date,
  currentMeter: number | null = null,
): NextOccurrence | null {
  if (s.triggerType === "time") {
    if (!s.intervalDays || s.intervalDays <= 0) return null;
    const base = s.lastCompletedAt ?? s.createdAt;
    const dueAt = timeDueDate(base, s.intervalDays);
    return { dueAt, dueMeter: null, status: classifyByDate(dueAt, now) };
  }
  if (!s.meterIntervalUnits || s.meterIntervalUnits <= 0) return null;
  const dueMeter = (s.lastCompletedMeter ?? 0) + s.meterIntervalUnits;
  return {
    dueAt: null,
    dueMeter,
    status: classifyByMeter(dueMeter, currentMeter),
  };
}

export interface ComplianceItem {
  status: PmTaskStatus;
  dueAt: Date | null;
  completedAt: Date | null;
}

/**
 * PM compliance over a trailing window: done-on-time ÷ (done + overdue +
 * skipped). A task is "on time" when it was completed on or before its due
 * date (meter tasks with no due date count as on time when completed).
 * Returns null when there is nothing to measure yet.
 */
export function computeCompliance(
  items: ComplianceItem[],
  now: Date,
  windowDays = 90,
): number | null {
  const start = now.getTime() - windowDays * DAY_MS;
  let onTime = 0;
  let denom = 0;
  for (const it of items) {
    const ref = (it.completedAt ?? it.dueAt)?.getTime();
    if (ref === undefined || ref < start || ref > now.getTime()) continue;
    if (it.status === "done" || it.status === "overdue" || it.status === "skipped") {
      denom += 1;
      if (it.status === "done") {
        const on =
          !it.dueAt ||
          (it.completedAt !== null && it.completedAt.getTime() <= it.dueAt.getTime());
        if (on) onTime += 1;
      }
    }
  }
  return denom === 0 ? null : onTime / denom;
}
