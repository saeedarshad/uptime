import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime, formatHours } from "@/lib/format";
import { formatWoNumber } from "@/lib/workorders";
import { PageHeader, StatusChip, Badge } from "@/components/ui";
import {
  updateWorkOrderAction,
  closeWorkOrderAction,
  reopenWorkOrderAction,
  addWorkOrderPhotoAction,
} from "../actions";
import { EditPanel, ClosePanel, AddPhotoPanel } from "./WorkOrderPanels";

export default async function WorkOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { org } = await requireAuth();
  const td = tenantDb(org.id);
  const wo = await td.workOrder.findFirst({
    where: { id: params.id },
    include: {
      asset: { select: { id: true, name: true } },
      photos: { orderBy: { createdAt: "asc" } },
      assignedTo: { select: { name: true } },
    },
  });
  if (!wo) notFound();

  const users = await td.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const totalCost = wo.partsCostCents + wo.laborCostCents;
  const boundUpdate = updateWorkOrderAction.bind(null, wo.id);
  const boundClose = closeWorkOrderAction.bind(null, wo.id);
  const boundReopen = reopenWorkOrderAction.bind(null, wo.id);
  const boundAddPhoto = addWorkOrderPhotoAction.bind(null, wo.id);

  return (
    <div>
      <PageHeader
        title={`${formatWoNumber(wo.number)} · ${wo.title}`}
        breadcrumbs={[{ label: "Work orders", href: "/work-orders" }]}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <StatusChip kind="wo" status={wo.status} />
        {wo.priority === "high" && <Badge tone="danger">high priority</Badge>}
        <span className="text-content/60">
          Asset:{" "}
          <Link
            href={`/assets/${wo.asset.id}`}
            className="font-medium text-safety"
          >
            {wo.asset.name}
          </Link>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EditPanel
            wo={{
              id: wo.id,
              status: wo.status,
              title: wo.title,
              description: wo.description,
              priority: wo.priority,
              partsCostCents: wo.partsCostCents,
              laborHours: Number(wo.laborHours),
              laborCostCents: wo.laborCostCents,
              downtimeHours: Number(wo.downtimeHours),
              assignedToUserId: wo.assignedToUserId,
            }}
            users={users}
            laborRateCents={org.laborRateCents}
            action={boundUpdate}
          />

          <div className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="eyebrow">Photos</h2>
            </div>
            {wo.photos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {wo.photos.map((p) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                    <Image
                      src={p.url}
                      alt="Work order photo"
                      width={120}
                      height={120}
                      unoptimized
                      className="h-28 w-28 rounded-md border border-content/10 object-cover"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-content/50">No photos yet.</p>
            )}
            <AddPhotoPanel action={boundAddPhoto} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card overflow-hidden text-sm">
            <div className="border-b border-content/[0.08] bg-content/[0.03] px-5 py-4">
              <div className="eyebrow">Total cost</div>
              <div className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-content">
                {formatMoney(totalCost)}
              </div>
            </div>
            <div className="space-y-3 p-5">
              <Row label="Parts" value={formatMoney(wo.partsCostCents)} />
              <Row label="Labor" value={formatMoney(wo.laborCostCents)} />
              <Row
                label="Downtime"
                value={formatHours(Number(wo.downtimeHours))}
              />
            <Row label="Reported by" value={wo.reportedByName} />
            <Row
              label="Assigned to"
              value={wo.assignedTo?.name ?? "Unassigned"}
            />
            {wo.symptom && <Row label="Symptom" value={wo.symptom} />}
            <Row
              label="Opened"
              value={formatDateTime(wo.openedAt, org.timezone)}
            />
            {wo.closedAt && (
              <Row
                label="Closed"
                value={formatDateTime(wo.closedAt, org.timezone)}
              />
            )}
            </div>
          </div>

          <ClosePanel
            status={wo.status}
            closeAction={boundClose}
            reopenAction={boundReopen}
          />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-content/5 pb-2 last:border-0 last:pb-0">
      <span className="text-content/50">{label}</span>
      <span
        className={`text-right ${strong ? "text-base font-bold" : "font-medium"} text-content`}
      >
        {value}
      </span>
    </div>
  );
}
