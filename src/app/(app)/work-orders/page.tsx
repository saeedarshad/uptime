import Link from "next/link";
import type { Prisma, WorkOrderStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { formatMoney, formatDate } from "@/lib/format";
import { formatWoNumber } from "@/lib/workorders";
import {
  PageHeader,
  StatusChip,
  Badge,
  EmptyState,
  LinkButton,
} from "@/components/ui";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; asset?: string };
}) {
  const { org } = await requireAuth();
  const td = tenantDb(org.id);

  const status = searchParams.status ?? "all";
  const assetId = searchParams.asset;

  const where: Prisma.WorkOrderWhereInput = {};
  if (status !== "all") where.status = status as WorkOrderStatus;
  if (assetId) where.assetId = assetId;

  const [workOrders, assets] = await Promise.all([
    td.workOrder.findMany({
      where,
      include: { asset: { select: { name: true } } },
      orderBy: [{ status: "asc" }, { openedAt: "desc" }],
    }),
    td.asset.findMany({
      where: { archived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, asset: assetId, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/work-orders?${s}` : "/work-orders";
  };

  return (
    <div>
      <PageHeader
        title="Work orders"
        action={<LinkButton href="/work-orders/new">New work order</LinkButton>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={qs({ status: f.key === "all" ? undefined : f.key })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              status === f.key
                ? "bg-graphite text-white"
                : "bg-white text-graphite/70 hover:bg-graphite/5"
            }`}
          >
            {f.label}
          </Link>
        ))}
        {assetId && (
          <Link
            href={qs({ asset: undefined })}
            className="ml-2 text-xs font-medium text-safety"
          >
            Clear asset filter ✕
          </Link>
        )}
      </div>

      {workOrders.length === 0 ? (
        <EmptyState
          title="No work orders"
          body="Work orders are created when a tech scans a QR and reports a problem — or add one here."
          action={
            <LinkButton href="/work-orders/new">
              Create a work order
            </LinkButton>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-graphite/10 bg-graphite/[0.03] text-left text-xs uppercase tracking-wide text-graphite/50">
                  <th className="px-4 py-3 font-semibold">WO</th>
                  <th className="px-4 py-3 font-semibold">Issue</th>
                  <th className="px-4 py-3 font-semibold">Asset</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Opened</th>
                  <th className="px-4 py-3 text-right font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => (
                  <tr
                    key={wo.id}
                    className="border-b border-graphite/5 last:border-0 hover:bg-graphite/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="font-semibold text-graphite hover:text-safety"
                      >
                        {formatWoNumber(wo.number)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-graphite">{wo.title}</td>
                    <td className="px-4 py-3 text-graphite/70">
                      {wo.asset.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip kind="wo" status={wo.status} />
                    </td>
                    <td className="px-4 py-3">
                      {wo.priority === "high" ? (
                        <Badge tone="danger">high</Badge>
                      ) : (
                        <span className="text-graphite/60">{wo.priority}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-graphite/60">
                      {formatDate(wo.openedAt, org.timezone)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatMoney(wo.partsCostCents + wo.laborCostCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
