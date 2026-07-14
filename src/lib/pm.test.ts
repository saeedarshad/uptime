import { describe, it, expect } from "vitest";
import {
  timeDueDate,
  classifyByDate,
  classifyByMeter,
  nextOccurrence,
  computeCompliance,
} from "./pm";

const DAY = 86_400_000;
const now = new Date("2026-07-14T12:00:00Z");
const d = (offsetDays: number) => new Date(now.getTime() + offsetDays * DAY);

describe("timeDueDate", () => {
  it("adds the interval to the base date", () => {
    expect(timeDueDate(new Date("2026-01-01T00:00:00Z"), 90)).toEqual(
      new Date("2026-04-01T00:00:00Z"),
    );
  });
});

describe("classifyByDate", () => {
  it("is overdue when the due date has passed", () => {
    expect(classifyByDate(d(-1), now)).toBe("overdue");
  });
  it("is due within the week window", () => {
    expect(classifyByDate(d(3), now)).toBe("due");
    expect(classifyByDate(d(7), now)).toBe("due");
  });
  it("is upcoming beyond the window", () => {
    expect(classifyByDate(d(30), now)).toBe("upcoming");
  });
});

describe("classifyByMeter", () => {
  it("is upcoming when no reading exists", () => {
    expect(classifyByMeter(5000, null)).toBe("upcoming");
  });
  it("is overdue at or past the due meter", () => {
    expect(classifyByMeter(5000, 5000)).toBe("overdue");
    expect(classifyByMeter(5000, 6000)).toBe("overdue");
  });
  it("is due within 10% of the boundary", () => {
    expect(classifyByMeter(5000, 4600)).toBe("due");
  });
  it("is upcoming well below the boundary", () => {
    expect(classifyByMeter(5000, 1000)).toBe("upcoming");
  });
});

describe("nextOccurrence", () => {
  it("uses lastCompletedAt + interval for time schedules", () => {
    const occ = nextOccurrence(
      {
        triggerType: "time",
        intervalDays: 90,
        meterIntervalUnits: null,
        lastCompletedAt: d(-100),
        lastCompletedMeter: null,
        createdAt: d(-200),
      },
      now,
    );
    // due = -100 + 90 = -10 days => overdue
    expect(occ?.status).toBe("overdue");
    expect(occ?.dueAt).toEqual(d(-10));
  });

  it("falls back to createdAt when never completed", () => {
    const occ = nextOccurrence(
      {
        triggerType: "time",
        intervalDays: 30,
        meterIntervalUnits: null,
        lastCompletedAt: null,
        lastCompletedMeter: null,
        createdAt: d(-5),
      },
      now,
    );
    // due = -5 + 30 = +25 => upcoming
    expect(occ?.status).toBe("upcoming");
  });

  it("computes meter due from lastCompletedMeter + interval", () => {
    const occ = nextOccurrence(
      {
        triggerType: "meter",
        intervalDays: null,
        meterIntervalUnits: 5000,
        lastCompletedAt: null,
        lastCompletedMeter: 105000,
        createdAt: d(-10),
      },
      now,
      109000,
    );
    expect(occ?.dueMeter).toBe(110000);
    expect(occ?.status).toBe("due"); // 109000 >= 110000*0.9
  });

  it("returns null for a misconfigured schedule", () => {
    expect(
      nextOccurrence(
        {
          triggerType: "time",
          intervalDays: null,
          meterIntervalUnits: null,
          lastCompletedAt: null,
          lastCompletedMeter: null,
          createdAt: now,
        },
        now,
      ),
    ).toBeNull();
  });
});

describe("computeCompliance", () => {
  it("returns null when nothing is measurable", () => {
    expect(computeCompliance([], now)).toBeNull();
  });

  it("counts done-on-time over done+overdue+skipped", () => {
    const items = [
      { status: "done" as const, dueAt: d(-20), completedAt: d(-21) }, // on time
      { status: "done" as const, dueAt: d(-20), completedAt: d(-18) }, // late
      { status: "overdue" as const, dueAt: d(-5), completedAt: null },
      { status: "skipped" as const, dueAt: d(-10), completedAt: null },
      { status: "upcoming" as const, dueAt: d(10), completedAt: null }, // excluded
    ];
    // onTime=1, denom=4 (2 done + 1 overdue + 1 skipped) => 0.25
    expect(computeCompliance(items, now)).toBeCloseTo(0.25);
  });

  it("ignores items outside the window", () => {
    const items = [
      { status: "done" as const, dueAt: d(-200), completedAt: d(-201) },
    ];
    expect(computeCompliance(items, now, 90)).toBeNull();
  });
});
