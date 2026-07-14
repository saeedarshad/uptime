import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { assetMetrics, EMPTY_METRIC } from "@/lib/metrics";
import { formatMoney, formatHours } from "@/lib/format";
import { PageHeader, StatusChip, EmptyState, LinkButton } from "@/components/ui";

export default async function AssetsPage() {
  const { org } = await requireAuth();
  const td = tenantDb(org.id);
  const [assets, metrics] = await Promise.all([
    td.asset.findMany({
      where: { archived: false },
      orderBy: { name: "asc" },
    }),
    assetMetrics(org.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle={`${assets.length} active`}
        action={
          <>
            <LinkButton href="/assets/import" variant="secondary">
              Import CSV
            </LinkButton>
            <LinkButton href="/assets/labels" variant="secondary">
              Print labels
            </LinkButton>
            <LinkButton href="/assets/new">Add asset</LinkButton>
          </>
        }
      />

      {assets.length === 0 ? (
        <EmptyState
          title="No assets yet"
          body="Add your first asset — or import a CSV to bring your whole shop in at once."
          action={
            <div className="flex gap-2">
              <LinkButton href="/assets/new">Add your first asset</LinkButton>
              <LinkButton href="/assets/import" variant="secondary">
                Import a CSV
              </LinkButton>
            </div>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-graphite/10 bg-graphite/[0.03] text-left text-xs uppercase tracking-wide text-graphite/50">
                  <th className="px-4 py-3 font-semibold">Asset</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Cost (90d)
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Downtime (90d)
                  </th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => {
                  const m = metrics.get(a.id) ?? EMPTY_METRIC;
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-graphite/5 last:border-0 hover:bg-graphite/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/assets/${a.id}`}
                          className="font-medium text-graphite hover:text-safety"
                        >
                          {a.name}
                        </Link>
                        {a.isComplianceTracked && (
                          <span className="ml-2 rounded bg-safety/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-safety">
                            Compliance
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip kind="asset" status={a.status} />
                      </td>
                      <td className="px-4 py-3 text-graphite/70">
                        {a.category ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-graphite/70">
                        {a.location ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {m.costCents > 0 ? formatMoney(m.costCents) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {m.downtimeHours > 0
                          ? formatHours(m.downtimeHours)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
