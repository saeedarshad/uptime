import { describe, it, expect } from "vitest";
import {
  computeSubscription,
  priceForInterval,
  PRICING,
  type SubscriptionInput,
} from "./subscription";

const NOW = new Date("2026-07-19T12:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

function input(overrides: Partial<SubscriptionInput> = {}): SubscriptionInput {
  return {
    plan: "trial",
    trialEndsAt: null,
    currentPeriodEndsAt: null,
    ...overrides,
  };
}

describe("computeSubscription", () => {
  it("is trialing while the trial has days left", () => {
    const s = computeSubscription(
      input({ plan: "trial", trialEndsAt: days(5) }),
      NOW,
    );
    expect(s.status).toBe("trialing");
    expect(s.accessAllowed).toBe(true);
    expect(s.daysRemaining).toBe(5);
    expect(s.endsAt).toEqual(days(5));
  });

  it("is trial_expired once the trial end passes (never paid)", () => {
    const s = computeSubscription(
      input({ plan: "trial", trialEndsAt: days(-1) }),
      NOW,
    );
    expect(s.status).toBe("trial_expired");
    expect(s.accessAllowed).toBe(false);
    expect(s.daysRemaining).toBeNull();
  });

  it("treats an exactly-now trial boundary as expired", () => {
    const s = computeSubscription(
      input({ plan: "trial", trialEndsAt: NOW }),
      NOW,
    );
    expect(s.status).toBe("trial_expired");
    expect(s.accessAllowed).toBe(false);
  });

  it("is active while a paid period covers now", () => {
    const s = computeSubscription(
      input({ plan: "active", currentPeriodEndsAt: days(20) }),
      NOW,
    );
    expect(s.status).toBe("active");
    expect(s.accessAllowed).toBe(true);
    expect(s.daysRemaining).toBe(20);
    expect(s.hasPaid).toBe(true);
  });

  it("prefers an active paid period over an unexpired trial", () => {
    const s = computeSubscription(
      input({
        plan: "trial",
        trialEndsAt: days(2),
        currentPeriodEndsAt: days(30),
      }),
      NOW,
    );
    expect(s.status).toBe("active");
    expect(s.endsAt).toEqual(days(30));
  });

  it("is expired after a paid period lapses", () => {
    const s = computeSubscription(
      input({ plan: "active", currentPeriodEndsAt: days(-3) }),
      NOW,
    );
    expect(s.status).toBe("expired");
    expect(s.accessAllowed).toBe(false);
    expect(s.hasPaid).toBe(true);
    expect(s.endsAt).toEqual(days(-3));
  });

  it("treats an exactly-now paid boundary as lapsed", () => {
    const s = computeSubscription(
      input({ plan: "active", currentPeriodEndsAt: NOW }),
      NOW,
    );
    expect(s.status).toBe("expired");
    expect(s.accessAllowed).toBe(false);
  });
});

describe("priceForInterval", () => {
  it("maps intervals to the flat prices", () => {
    expect(priceForInterval("monthly")).toBe(PRICING.monthlyCents);
    expect(priceForInterval("annual")).toBe(PRICING.annualCents);
  });
});
