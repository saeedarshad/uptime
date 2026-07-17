import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { PageHeader, EmptyState, LinkButton } from "@/components/ui";
import { ScheduleForm } from "./ScheduleForm";

export default async function NewSchedulePage({
  searchParams,
}: {
  searchParams: { asset?: string };
}) {
  const { org } = await requireAuth();
  const assets = await tenantDb(org.id).asset.findMany({
    where: { archived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New maintenance schedule"
        breadcrumbs={[{ label: "Schedule", href: "/schedule" }]}
        action={
          <Link href="/schedule" className="btn-ghost">
            Cancel
          </Link>
        }
      />
      {assets.length === 0 ? (
        <EmptyState
          title="Add an asset first"
          body="Schedules attach to an asset. Add one, then come back."
          action={<LinkButton href="/assets/new">Add an asset</LinkButton>}
        />
      ) : (
        <ScheduleForm assets={assets} defaultAssetId={searchParams.asset} />
      )}
    </div>
  );
}
