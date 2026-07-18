import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { computeSubscription, PRICING } from "@/lib/subscription";
import { formatMoney, formatDate } from "@/lib/format";
import { logoutAction } from "../(app)/actions";

export const metadata = { title: "Subscription required — UptimeHQ" };

export default async function LockedPage() {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  const { org } = auth;

  const state = computeSubscription(org);
  // Active/trialing users have no business here — send them back in.
  if (state.accessAllowed) redirect("/dashboard");

  const payments = await tenantDb(org.id).subscriptionPayment.findMany({
    where: { voided: false },
    orderBy: { periodEnd: "desc" },
    take: 5,
  });

  // Wording keys off whether the org has *ever* paid (history), not just the
  // denormalized field — a force-expired paying customer isn't "on a trial".
  const everPaid = payments.length > 0;
  const expiredTrial = !everPaid;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-danger/10 blur-3xl"
      />
      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-safety to-safety/80 text-xl font-black text-white shadow-card ring-1 ring-white/20">
              U
            </div>
            <span className="text-2xl font-bold tracking-tight text-content">
              UptimeHQ
            </span>
          </div>
        </div>

        <div className="card p-7 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger ring-1 ring-inset ring-danger/20">
            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
            {expiredTrial ? "Trial ended" : "Subscription expired"}
          </span>

          <h1 className="mt-4 text-xl font-bold tracking-tight text-content">
            {expiredTrial
              ? "Your 14-day free trial has ended"
              : "Your subscription has lapsed"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-content/60">
            {expiredTrial
              ? `Thanks for trying UptimeHQ with ${org.name}. To keep using your dashboard, work orders, and insights, activate a plan below.`
              : `Access to ${org.name} is paused because the current subscription period has ended.`}
            {state.endsAt && (
              <>
                {" "}
                {everPaid ? "Paid through" : "Trial ended"}{" "}
                <span className="font-semibold text-content/80">
                  {formatDate(state.endsAt, org.timezone)}
                </span>
                .
              </>
            )}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-content/[0.08] p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-content/50">
                Monthly
              </div>
              <div className="mt-1 text-2xl font-bold text-content">
                {formatMoney(PRICING.monthlyCents)}
                <span className="text-sm font-medium text-content/50">
                  {" "}
                  / mo
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-safety/30 bg-safety/[0.04] p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-safety">
                Annual · 2 months free
              </div>
              <div className="mt-1 text-2xl font-bold text-content">
                {formatMoney(PRICING.annualCents)}
                <span className="text-sm font-medium text-content/50">
                  {" "}
                  / yr
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-content/[0.08] bg-content/[0.02] p-4 text-sm leading-relaxed text-content/70">
            Payment is handled off-platform. Reach out to activate or renew and
            we&apos;ll switch your account back on — usually the same day.
            <a
              href="mailto:billing@uptimehq.app"
              className="mt-2 block font-semibold text-safety hover:underline"
            >
              billing@uptimehq.app
            </a>
          </div>

          {payments.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-content/50">
                Recent payments
              </h2>
              <div className="mt-2 divide-y divide-content/[0.06]">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-content/70">
                      {formatDate(p.periodStart, org.timezone)} –{" "}
                      {formatDate(p.periodEnd, org.timezone)}
                    </span>
                    <span className="font-semibold tabular-nums text-content">
                      {formatMoney(p.amountCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form action={logoutAction} className="mt-7">
            <button className="btn-secondary w-full py-2.5">Sign out</button>
          </form>
        </div>
      </div>
    </div>
  );
}
