import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { assetMetrics, EMPTY_METRIC } from "@/lib/metrics";
import {
  formatMoney,
  formatHours,
  formatDate,
  daysUntil,
} from "@/lib/format";
import { formatWoNumber } from "@/lib/workorders";
import { PageHeader, StatusChip, Badge } from "@/components/ui";
import { setAssetArchived, addAssetDocument } from "../actions";
import { AddDocument } from "./AddDocument";

const TABS = [
  { key: "history", label: "History" },
  { key: "schedules", label: "Schedules" },
  { key: "documents", label: "Documents" },
  { key: "meter", label: "Meter readings" },
];

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string };
}) {
  const { org } = await requireAuth();
  const td = tenantDb(org.id);
  const asset = await td.asset.findFirst({ where: { id: params.id } });
  if (!asset) notFound();

  const tab = searchParams.tab ?? "history";
  const metrics = await assetMetrics(org.id);
  const m = metrics.get(asset.id) ?? EMPTY_METRIC;
  const archive = setAssetArchived.bind(null, asset.id, true);
  const boundAddDoc = addAssetDocument.bind(null, asset.id);

  return (
    <div>
      <PageHeader
        title={asset.name}
        subtitle={[asset.category, asset.location].filter(Boolean).join(" · ")}
        action={
          <>
            <a
              href={`/assets/${asset.id}/export.pdf`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Export PDF
            </a>
            <Link href={`/assets/${asset.id}/label`} className="btn-secondary">
              Label
            </Link>
            <Link
              href={`/work-orders/new?asset=${asset.id}`}
              className="btn-secondary"
            >
              New WO
            </Link>
            <Link href={`/assets/${asset.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          </>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <StatusChip kind="asset" status={asset.status} />
        {asset.isComplianceTracked && (
          <Badge tone="info">Compliance-tracked</Badge>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Cost (90d)" value={formatMoney(m.costCents)} />
        <Stat label="Downtime (90d)" value={formatHours(m.downtimeHours)} />
        <Stat label="Work orders (90d)" value={String(m.woCount)} />
        <Stat
          label="Purchase cost"
          value={
            asset.purchaseCostCents ? formatMoney(asset.purchaseCostCents) : "—"
          }
        />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-graphite/10">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/assets/${asset.id}?tab=${t.key}`}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-safety text-graphite"
                : "border-transparent text-graphite/50 hover:text-graphite"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "history" && <HistoryTab orgId={org.id} asset={asset} tz={org.timezone} />}
      {tab === "schedules" && (
        <SchedulesTab assetId={asset.id} orgId={org.id} tz={org.timezone} />
      )}
      {tab === "documents" && (
        <DocumentsTab assetId={asset.id} tz={org.timezone} addDoc={boundAddDoc} />
      )}
      {tab === "meter" && <MeterTab assetId={asset.id} tz={org.timezone} />}

      <form action={archive} className="mt-10">
        <button className="text-sm font-medium text-danger/80 hover:text-danger">
          Archive this asset
        </button>
      </form>
    </div>
  );
}

async function HistoryTab({
  orgId,
  asset,
  tz,
}: {
  orgId: string;
  asset: { id: string };
  tz: string;
}) {
  const [workOrders, pmDone] = await Promise.all([
    prisma.workOrder.findMany({
      where: { orgId, assetId: asset.id },
      orderBy: { openedAt: "desc" },
    }),
    prisma.pMTask.findMany({
      where: { schedule: { assetId: asset.id }, status: "done" },
      include: { schedule: { select: { taskName: true } } },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  type Item = { date: Date; node: React.ReactNode };
  const items: Item[] = [];
  for (const wo of workOrders) {
    items.push({
      date: wo.openedAt,
      node: (
        <div key={`wo-${wo.id}`} className="flex items-start justify-between gap-4 border-b border-graphite/5 py-3 last:border-0">
          <div>
            <Link
              href={`/work-orders/${wo.id}`}
              className="font-medium text-graphite hover:text-safety"
            >
              {formatWoNumber(wo.number)} · {wo.title}
            </Link>
            <div className="mt-0.5 text-xs text-graphite/50">
              {formatDate(wo.openedAt, tz)} · reported by {wo.reportedByName}
            </div>
          </div>
          <div className="text-right">
            <StatusChip kind="wo" status={wo.status} />
            <div className="mt-1 text-sm font-medium tabular-nums text-graphite">
              {formatMoney(wo.partsCostCents + wo.laborCostCents)}
            </div>
          </div>
        </div>
      ),
    });
  }
  for (const pm of pmDone) {
    const when = pm.completedAt ?? pm.createdAt;
    items.push({
      date: when,
      node: (
        <div key={`pm-${pm.id}`} className="flex items-start justify-between gap-4 border-b border-graphite/5 py-3 last:border-0">
          <div>
            <span className="font-medium text-graphite">
              PM · {pm.schedule.taskName}
            </span>
            <div className="mt-0.5 text-xs text-graphite/50">
              {formatDate(when, tz)}
              {pm.completedByName ? ` · by ${pm.completedByName}` : ""}
            </div>
          </div>
          <Badge tone="ok">completed</Badge>
        </div>
      ),
    });
  }
  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  if (items.length === 0) {
    return (
      <p className="card p-6 text-sm text-graphite/50">
        No history yet. Work orders and completed PM tasks show up here.
      </p>
    );
  }
  return <div className="card px-5 py-1">{items.map((i) => i.node)}</div>;
}

async function SchedulesTab({
  assetId,
  orgId,
  tz,
}: {
  assetId: string;
  orgId: string;
  tz: string;
}) {
  const schedules = await prisma.pMSchedule.findMany({
    where: { orgId, assetId },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Link
          href={`/schedule/new?asset=${assetId}`}
          className="btn-secondary"
        >
          Add schedule
        </Link>
      </div>
      {schedules.length === 0 ? (
        <p className="card p-6 text-sm text-graphite/50">
          No maintenance schedules for this asset yet.
        </p>
      ) : (
        <div className="card divide-y divide-graphite/5">
          {schedules.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-graphite">{s.taskName}</div>
                <div className="text-xs text-graphite/50">
                  {s.triggerType === "time"
                    ? `Every ${s.intervalDays} days`
                    : `Every ${s.meterIntervalUnits} ${s.meterUnitLabel}`}
                  {s.lastCompletedAt
                    ? ` · last done ${formatDate(s.lastCompletedAt, tz)}`
                    : " · never completed"}
                </div>
              </div>
              {!s.active && <Badge tone="muted">inactive</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function DocumentsTab({
  assetId,
  tz,
  addDoc,
}: {
  assetId: string;
  tz: string;
  addDoc: Parameters<typeof AddDocument>[0]["action"];
}) {
  const docs = await prisma.assetDocument.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();
  return (
    <div className="space-y-4">
      {docs.length === 0 ? (
        <p className="card p-6 text-sm text-graphite/50">
          No documents yet. Upload manuals, calibration or inspection
          certificates below.
        </p>
      ) : (
        <div className="card divide-y divide-graphite/5">
          {docs.map((d) => {
            const days = d.expiresAt ? daysUntil(d.expiresAt, now) : null;
            return (
              <div key={d.id} className="flex items-center justify-between p-4">
                <div>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-graphite hover:text-safety"
                  >
                    {d.title}
                  </a>
                  <div className="text-xs capitalize text-graphite/50">
                    {d.kind}
                    {d.expiresAt
                      ? ` · expires ${formatDate(d.expiresAt, tz)}`
                      : ""}
                  </div>
                </div>
                {days !== null &&
                  (days < 0 ? (
                    <Badge tone="danger">expired</Badge>
                  ) : days <= 30 ? (
                    <Badge tone="warn">{days}d left</Badge>
                  ) : null)}
              </div>
            );
          })}
        </div>
      )}
      <AddDocument action={addDoc} />
    </div>
  );
}

async function MeterTab({ assetId, tz }: { assetId: string; tz: string }) {
  const readings = await prisma.meterReading.findMany({
    where: { assetId },
    orderBy: { readAt: "desc" },
    take: 50,
  });
  if (readings.length === 0) {
    return (
      <p className="card p-6 text-sm text-graphite/50">
        No meter readings yet. Techs log these from the QR scan page.
      </p>
    );
  }
  return (
    <div className="card divide-y divide-graphite/5">
      {readings.map((r) => (
        <div key={r.id} className="flex items-center justify-between p-4">
          <div className="font-medium tabular-nums text-graphite">
            {Number(r.value).toLocaleString()} {r.unitLabel}
          </div>
          <div className="text-xs text-graphite/50">
            {formatDate(r.readAt, tz)} · {r.enteredByName}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-graphite/50">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums text-graphite">
        {value}
      </div>
    </div>
  );
}
