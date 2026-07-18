// Subscription access logic. The *pure* parts (pricing + status computation)
// live here and are fixture-tested; the DB-touching `syncOrgSubscription`
// helper is a thin sibling used by the admin panel to keep the denormalized
// `currentPeriodEndsAt`/`plan` fields on Organization in step with payments.
//
// Access is COMPUTED, never read straight off `Organization.plan`: an org has
// access while trialing (trialEndsAt in the future) or while a paid period
// covers "now" (currentPeriodEndsAt in the future).

import type { BillingInterval, Plan } from "@prisma/client";
import { prisma } from "./prisma";
import { daysUntil } from "./format";

/** Flat pricing, in integer cents. Single source of truth for UI + admin. */
export const PRICING = {
  monthlyCents: 4900,
  annualCents: 49000, // 2 months free vs 12 × $49
} as const;

export function priceForInterval(interval: BillingInterval): number {
  return interval === "annual" ? PRICING.annualCents : PRICING.monthlyCents;
}

export type SubscriptionStatus =
  | "trialing"
  | "trial_expired"
  | "active"
  | "expired";

export interface SubscriptionInput {
  plan: Plan;
  trialEndsAt: Date | null;
  currentPeriodEndsAt: Date | null;
}

export interface SubscriptionState {
  status: SubscriptionStatus;
  /** Whether the org may use the authenticated app. */
  accessAllowed: boolean;
  /** The date access lapses (trial end when trialing, paid-through when active). */
  endsAt: Date | null;
  /** Whole days until `endsAt`; null when there is no relevant date. */
  daysRemaining: number | null;
  /** True once at least one paid period has ever existed. */
  hasPaid: boolean;
}

/**
 * Pure: derive the access state for an org at a given instant.
 *
 * Order of precedence:
 *  1. A paid period covering `now` → active.
 *  2. Otherwise, an unexpired trial → trialing.
 *  3. Otherwise expired: `expired` if a paid period ever existed, else
 *     `trial_expired`.
 */
export function computeSubscription(
  input: SubscriptionInput,
  now: Date = new Date(),
): SubscriptionState {
  const { trialEndsAt, currentPeriodEndsAt } = input;
  const hasPaid = currentPeriodEndsAt != null;

  if (currentPeriodEndsAt && currentPeriodEndsAt.getTime() > now.getTime()) {
    return {
      status: "active",
      accessAllowed: true,
      endsAt: currentPeriodEndsAt,
      daysRemaining: daysUntil(currentPeriodEndsAt, now),
      hasPaid,
    };
  }

  if (
    input.plan === "trial" &&
    !hasPaid &&
    trialEndsAt &&
    trialEndsAt.getTime() > now.getTime()
  ) {
    return {
      status: "trialing",
      accessAllowed: true,
      endsAt: trialEndsAt,
      daysRemaining: daysUntil(trialEndsAt, now),
      hasPaid,
    };
  }

  return {
    status: hasPaid ? "expired" : "trial_expired",
    accessAllowed: false,
    endsAt: currentPeriodEndsAt ?? trialEndsAt,
    daysRemaining: null,
    hasPaid,
  };
}

/**
 * DB sibling (not pure): after a payment is recorded, voided, or trial changed,
 * recompute `currentPeriodEndsAt` from the surviving (non-voided) payments and
 * nudge `plan` to reflect reality. Cross-tenant helper — takes an explicit
 * orgId; safe to call from the admin surface.
 */
export async function syncOrgSubscription(orgId: string): Promise<void> {
  const latest = await prisma.subscriptionPayment.findFirst({
    where: { orgId, voided: false },
    orderBy: { periodEnd: "desc" },
    select: { periodEnd: true },
  });
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });
  if (!org) return;

  const currentPeriodEndsAt = latest?.periodEnd ?? null;
  const covered =
    currentPeriodEndsAt != null &&
    currentPeriodEndsAt.getTime() > Date.now();

  // Keep `plan` roughly in sync: paid & covering → active; if no covering
  // period and we were "active", drop back to "cancelled". Never clobber an
  // explicit "cancelled" while uncovered, and leave "trial" alone.
  let plan: Plan = org.plan;
  if (covered) plan = "active";
  else if (org.plan === "active") plan = "cancelled";

  await prisma.organization.update({
    where: { id: orgId },
    data: { currentPeriodEndsAt, plan },
  });
}
