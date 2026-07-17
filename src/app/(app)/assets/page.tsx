import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { assetMetrics, EMPTY_METRIC } from "@/lib/metrics";
import { formatMoney, formatHours } from "@/lib/format";
import { PageHeader, StatusChip, EmptyState, LinkButton } from "@/components/ui";
import { ActionMenu } from "@/components/ActionMenu";

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
            <LinkButton href="/assets/new">Add asset</LinkButton>
            <ActionMenu
              label="More"
              items={[
                {
                  label: "Import CSV",
                  href: "/assets/import",
                  iconPath: "M12 3v12m0 0l-4-4m4 4l4-4M5 21h14",
                },
                {
                  label: "Print labels",
                  href: "/assets/labels",
                  iconPath:
                    "M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2M6 14h12v7H6z",
                },
              ]}
            />
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
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th className="text-right">Cost (90d)</th>
                  <th className="text-right">Downtime (90d)</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => {
                  const m = metrics.get(a.id) ?? EMPTY_METRIC;
                  return (
                    <tr key={a.id}>
                      <td>
                        <Link
                          href={`/assets/${a.id}`}
                          className="font-semibold text-content hover:text-safety"
                        >
                          {a.name}
                        </Link>
                        {a.isComplianceTracked && (
                          <span className="ml-2 rounded-full bg-safety/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-safety ring-1 ring-inset ring-safety/20">
                            Compliance
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusChip kind="asset" status={a.status} />
                      </td>
                      <td className="text-content/70">{a.category ?? "—"}</td>
                      <td className="text-content/70">{a.location ?? "—"}</td>
                      <td className="text-right font-semibold tabular-nums text-content">
                        {m.costCents > 0 ? formatMoney(m.costCents) : "—"}
                      </td>
                      <td className="text-right tabular-nums text-content/80">
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
