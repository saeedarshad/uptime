import { requireManager } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { appUrl } from "@/lib/qr";
import { computeSubscription, PRICING } from "@/lib/subscription";
import { formatMoney, formatDate } from "@/lib/format";
import { PageHeader, Badge, type StatusTone } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import {
  ProfileForm,
  PinForm,
  ChipsForm,
  InviteForm,
} from "./SettingsForms";
import { revokeInvite } from "./actions";

export default async function SettingsPage() {
  const { org } = await requireManager();
  const td = tenantDb(org.id);
  const [users, invites, payments] = await Promise.all([
    td.user.findMany({ orderBy: { name: "asc" } }),
    td.invite.findMany({
      where: { acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    td.subscriptionPayment.findMany({
      where: { voided: false },
      orderBy: { periodEnd: "desc" },
    }),
  ]);
  const sub = computeSubscription(org);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Your org profile, labor rate, PIN, symptom chips and team."
      />
      <div className="space-y-6">
        <SubscriptionCard
          org={org}
          sub={sub}
          payments={payments}
        />
        <ProfileForm
          org={{
            name: org.name,
            city: org.city,
            timezone: org.timezone,
            businessType: org.businessType,
            laborRateCents: org.laborRateCents,
          }}
        />
        <PinForm pinEnabled={!!org.pinCode} />
        <ChipsForm chips={org.symptomChips} />

        <div className="card p-6">
          <div className="mb-5 border-b border-content/[0.06] pb-4">
            <h2 className="text-base font-bold text-content">Team</h2>
            <p className="mt-1 text-sm leading-relaxed text-content/60">
              Unlimited users on every plan. Invite by email — they set a
              password from the link, no verification hoops.
            </p>
          </div>

          <div className="mb-6 divide-y divide-content/[0.06]">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-content/[0.06] text-[11px] font-bold text-content/60">
                    {u.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <div className="font-semibold text-content">{u.name}</div>
                    <div className="text-xs text-content/50">{u.email}</div>
                  </div>
                </div>
                <Badge tone={u.role === "tech" ? "muted" : "info"}>
                  {u.role}
                </Badge>
              </div>
            ))}
          </div>

          <InviteForm />

          {invites.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-content/70">
                Pending invites
              </h3>
              <div className="divide-y divide-content/5">
                {invites.map((inv) => {
                  const link = `${appUrl()}/invite/${inv.token}`;
                  const revoke = revokeInvite.bind(null, inv.id);
                  return (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <div>
                        <span className="font-medium text-content">
                          {inv.name}
                        </span>
                        <span className="ml-2 text-content/50">
                          {inv.email} · {inv.role}
                        </span>
                        <div className="mt-0.5 break-all font-mono text-xs text-content/40">
                          {link}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <CopyButton value={link} />
                        <form action={revoke}>
                          <button className="btn-ghost text-xs text-danger/80">
                            Revoke
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_META: Record<
  ReturnType<typeof computeSubscription>["status"],
  { tone: StatusTone; label: string }
> = {
  trialing: { tone: "info", label: "Free trial" },
  active: { tone: "ok", label: "Active" },
  trial_expired: { tone: "danger", label: "Trial ended" },
  expired: { tone: "danger", label: "Expired" },
};

function SubscriptionCard({
  org,
  sub,
  payments,
}: {
  org: { timezone: string };
  sub: ReturnType<typeof computeSubscription>;
  payments: {
    id: string;
    interval: string;
    amountCents: number;
    periodStart: Date;
    periodEnd: Date;
    paidAt: Date;
  }[];
}) {
  const meta = STATUS_META[sub.status];
  const dateLabel =
    sub.status === "active"
      ? "Paid through"
      : sub.status === "trialing"
        ? "Trial ends"
        : sub.hasPaid
          ? "Lapsed on"
          : "Trial ended";

  return (
    <div id="subscription" className="card scroll-mt-20 p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-content/[0.06] pb-4">
        <div>
          <h2 className="text-base font-bold text-content">Subscription</h2>
          <p className="mt-1 text-sm leading-relaxed text-content/60">
            Flat pricing, unlimited users. {formatMoney(PRICING.monthlyCents)}
            /mo or {formatMoney(PRICING.annualCents)}/yr (2 months free).
          </p>
        </div>
        <Badge tone={meta.tone} dot>
          {meta.label}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-content/[0.08] p-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-content/50">
            {dateLabel}
          </div>
          <div className="mt-1 text-lg font-bold text-content">
            {sub.endsAt ? formatDate(sub.endsAt, org.timezone) : "—"}
          </div>
          {sub.accessAllowed && sub.daysRemaining != null && (
            <div className="mt-0.5 text-xs text-content/50">
              {sub.daysRemaining === 1
                ? "1 day remaining"
                : `${sub.daysRemaining} days remaining`}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-content/[0.08] p-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-content/50">
            How to renew
          </div>
          <p className="mt-1 text-sm leading-relaxed text-content/70">
            Payment is handled off-platform. Contact{" "}
            <a
              href="mailto:billing@uptimehq.app"
              className="font-semibold text-safety hover:underline"
            >
              billing@uptimehq.app
            </a>{" "}
            to renew or change plans.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-content/70">
          Renewal history
        </h3>
        {payments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-content/[0.12] px-4 py-6 text-center text-sm text-content/50">
            No payments yet — you&apos;re on the free trial.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-content/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-content/[0.06] bg-content/[0.02] text-left text-[11px] font-semibold uppercase tracking-wide text-content/50">
                  <th className="px-4 py-2">Paid</th>
                  <th className="px-4 py-2">Period</th>
                  <th className="px-4 py-2">Plan</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-content/[0.06]">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-content/70">
                      {formatDate(p.paidAt, org.timezone)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-content/70">
                      {formatDate(p.periodStart, org.timezone)} –{" "}
                      {formatDate(p.periodEnd, org.timezone)}
                    </td>
                    <td className="px-4 py-2.5 capitalize text-content/70">
                      {p.interval}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums text-content">
                      {formatMoney(p.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
