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

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={qs({ status: f.key === "all" ? undefined : f.key })}
            className={`pill ${status === f.key ? "pill-active" : ""}`}
          >
            {f.label}
          </Link>
        ))}
        {assetId && (
          <Link
            href={qs({ asset: undefined })}
            className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-safety hover:underline"
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
            <table className="data-table">
              <thead>
                <tr>
                  <th>WO</th>
                  <th>Issue</th>
                  <th>Asset</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Opened</th>
                  <th className="text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td>
                      <Link
                        href={`/work-orders/${wo.id}`}
                        className="font-semibold text-graphite hover:text-safety"
                      >
                        {formatWoNumber(wo.number)}
                      </Link>
                    </td>
                    <td className="font-medium text-graphite">{wo.title}</td>
                    <td className="text-graphite/70">{wo.asset.name}</td>
                    <td>
                      <StatusChip kind="wo" status={wo.status} />
                    </td>
                    <td>
                      {wo.priority === "high" ? (
                        <Badge tone="danger" dot>
                          high
                        </Badge>
                      ) : (
                        <span className="capitalize text-graphite/60">
                          {wo.priority}
                        </span>
                      )}
                    </td>
                    <td className="text-graphite/60">
                      {formatDate(wo.openedAt, org.timezone)}
                    </td>
                    <td className="text-right font-semibold tabular-nums text-graphite">
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
