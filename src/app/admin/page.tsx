import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeSubscription } from "@/lib/subscription";
import { formatDate } from "@/lib/format";
import { Badge, type StatusTone } from "@/components/ui";
import { AdminPasswordForm } from "./PasswordForm";

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

export default async function AdminDashboard() {
  await requireAdmin();
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      plan: true,
      trialEndsAt: true,
      currentPeriodEndsAt: true,
      timezone: true,
      createdAt: true,
      _count: { select: { users: true, assets: true } },
    },
  });

  const rows = orgs.map((o) => ({ org: o, sub: computeSubscription(o) }));
  const activeCount = rows.filter((r) => r.sub.status === "active").length;
  const trialingCount = rows.filter((r) => r.sub.status === "trialing").length;
  const lapsedCount = rows.filter((r) => !r.sub.accessAllowed).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-content">
          Organizations
        </h1>
        <p className="mt-1 text-sm text-content/60">
          {orgs.length} total · {activeCount} active · {trialingCount} trialing ·{" "}
          {lapsedCount} lapsed
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-content/[0.08] bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-content/[0.06] bg-content/[0.02] text-left text-[11px] font-semibold uppercase tracking-wide text-content/50">
              <th className="px-4 py-2.5">Organization</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Renews / ends</th>
              <th className="px-4 py-2.5 text-right">Users</th>
              <th className="px-4 py-2.5 text-right">Assets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-content/[0.06]">
            {rows.map(({ org, sub }) => {
              const meta = STATUS_TONE[sub.status];
              return (
                <tr
                  key={org.id}
                  className="transition-colors hover:bg-content/[0.02]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orgs/${org.id}`}
                      className="font-semibold text-content hover:text-safety"
                    >
                      {org.name}
                    </Link>
                    <div className="text-xs text-content/40">
                      Joined {formatDate(org.createdAt, org.timezone)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={meta.tone} dot>
                      {meta.label}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-content/70">
                    {sub.endsAt ? formatDate(sub.endsAt, org.timezone) : "—"}
                    {sub.accessAllowed && sub.daysRemaining != null && (
                      <span className="ml-1 text-xs text-content/40">
                        ({sub.daysRemaining}d)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-content/70">
                    {org._count.users}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-content/70">
                    {org._count.assets}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-xl border border-content/[0.08] bg-surface p-6">
        <h2 className="text-base font-bold text-content">Account</h2>
        <p className="mb-4 mt-1 text-sm text-content/60">
          Change your admin sign-in password.
        </p>
        <AdminPasswordForm />
      </div>
    </div>
  );
}
