import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSubscription, PRICING } from "@/lib/subscription";
import { formatMoney, formatDate } from "@/lib/format";
import { Badge, type StatusTone } from "@/components/ui";
import { PaymentForm, TrialForm } from "./PaymentForm";
import { voidPayment, cancelSubscription } from "../../actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<
  ReturnType<typeof computeSubscription>["status"],
  { tone: StatusTone; label: string }
> = {
  trialing: { tone: "info", label: "Trialing" },
  active: { tone: "ok", label: "Active" },
  trial_expired: { tone: "danger", label: "Trial ended" },
  expired: { tone: "danger", label: "Expired" },
};

export default async function AdminOrgDetail({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const org = await prisma.organization.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { users: true, assets: true } },
      subscriptionPayments: { orderBy: { periodEnd: "desc" } },
    },
  });
  if (!org) notFound();

  const sub = computeSubscription(org);
  const meta = STATUS_TONE[sub.status];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-medium text-content/50 hover:text-content"
        >
          ← All organizations
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-content">
            {org.name}
          </h1>
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-content/60">
          {org._count.users} users · {org._count.assets} assets · joined{" "}
          {formatDate(org.createdAt, org.timezone)}
        </p>
      </div>

      {/* Status summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-content/50">
            Access
          </div>
          <div className="mt-1 text-lg font-bold text-content">
            {sub.accessAllowed ? "Allowed" : "Locked"}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-content/50">
            {sub.status === "active" ? "Paid through" : "Trial ends"}
          </div>
          <div className="mt-1 text-lg font-bold text-content">
            {sub.endsAt ? formatDate(sub.endsAt, org.timezone) : "—"}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-content/50">
            Days remaining
          </div>
          <div className="mt-1 text-lg font-bold text-content">
            {sub.daysRemaining ?? "—"}
          </div>
        </div>
      </div>

      {/* Record payment */}
      <div className="card p-6">
        <h2 className="mb-4 text-base font-bold text-content">
          Record a payment
        </h2>
        <PaymentForm
          orgId={org.id}
          monthlyAmount={PRICING.monthlyCents / 100}
          annualAmount={PRICING.annualCents / 100}
        />
      </div>

      {/* Payment history */}
      <div className="card p-6">
        <h2 className="mb-4 text-base font-bold text-content">
          Payment history
        </h2>
        {org.subscriptionPayments.length === 0 ? (
          <p className="text-sm text-content/50">No payments recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-content/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-content/[0.06] bg-content/[0.02] text-left text-[11px] font-semibold uppercase tracking-wide text-content/50">
                  <th className="px-3 py-2">Paid</th>
                  <th className="px-3 py-2">Period</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Ref</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-content/[0.06]">
                {org.subscriptionPayments.map((p) => {
                  const doVoid = voidPayment.bind(null, p.id, org.id);
                  return (
                    <tr
                      key={p.id}
                      className={p.voided ? "opacity-40" : undefined}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 text-content/70">
                        {formatDate(p.paidAt, org.timezone)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-content/70">
                        {formatDate(p.periodStart, org.timezone)} –{" "}
                        {formatDate(p.periodEnd, org.timezone)}
                      </td>
                      <td className="px-3 py-2.5 capitalize text-content/70">
                        {p.interval}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-content">
                        {formatMoney(p.amountCents)}
                      </td>
                      <td className="px-3 py-2.5 text-content/50">
                        {p.reference || p.method || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {p.voided ? (
                          <span className="text-xs text-content/40">
                            Voided
                          </span>
                        ) : (
                          <form action={doVoid}>
                            <button className="btn-ghost text-xs text-danger/80">
                              Void
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual controls */}
      <div className="card p-6">
        <h2 className="mb-1 text-base font-bold text-content">
          Manual controls
        </h2>
        <p className="mb-4 text-sm text-content/60">
          Extend the trial or force-expire the subscription.
        </p>
        <TrialForm
          orgId={org.id}
          trialEndsAt={
            org.trialEndsAt ? org.trialEndsAt.toISOString().slice(0, 10) : null
          }
        />
        <div className="mt-5 border-t border-content/[0.06] pt-5">
          <form action={cancelSubscription.bind(null, org.id)}>
            <button className="btn-ghost text-sm text-danger/80">
              Force-expire subscription
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
