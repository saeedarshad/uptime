import Link from "next/link";

export type OnboardingStep = {
  label: string;
  hint: string;
  href: string;
  done: boolean;
};

/** New-user checklist. Renders only while setup is incomplete; the dashboard
 *  drops it entirely once every step is done. */
export function GettingStarted({ steps }: { steps: OnboardingStep[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <section className="card mb-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-content/[0.06] bg-content/[0.02] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-safety/10 text-safety">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2-6.3-4.6L5.7 21l2.3-7.2-6-4.4h7.6z" />
            </svg>
          </span>
          <div>
            <h2 className="text-base font-bold text-content">Get set up</h2>
            <p className="text-sm text-content/60">
              A few quick steps to get your shop tracking maintenance.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-content/10">
            <div
              className="h-full rounded-full bg-safety transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums text-content/60">
            {doneCount}/{steps.length}
          </span>
        </div>
      </div>

      <ol className="divide-y divide-content/[0.06]">
        {steps.map((step) => {
          const isNext = step === next;
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-safety/[0.04]"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${
                    step.done
                      ? "bg-ok/10 text-ok ring-ok/20"
                      : isNext
                        ? "bg-safety/10 text-safety ring-safety/30"
                        : "bg-content/[0.04] text-content/30 ring-content/15"
                  }`}
                >
                  {step.done ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                      aria-hidden
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-semibold ${
                      step.done ? "text-content/50 line-through" : "text-content"
                    }`}
                  >
                    {step.label}
                  </div>
                  {!step.done && (
                    <div className="text-xs text-content/50">{step.hint}</div>
                  )}
                </div>
                {!step.done && (
                  <span
                    className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${
                      isNext ? "text-safety" : "text-content/40"
                    }`}
                  >
                    {isNext ? "Start" : "Do this"}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
