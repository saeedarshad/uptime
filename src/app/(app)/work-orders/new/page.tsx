import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { PageHeader, EmptyState, LinkButton } from "@/components/ui";
import { NewWorkOrderForm } from "./NewWorkOrderForm";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: { asset?: string; title?: string; priority?: string };
}) {
  const { org, user } = await requireAuth();
  const assets = await tenantDb(org.id).asset.findMany({
    where: { archived: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New work order"
        action={
          <Link href="/work-orders" className="btn-ghost">
            Cancel
          </Link>
        }
      />
      {assets.length === 0 ? (
        <EmptyState
          title="Add an asset first"
          body="Work orders attach to an asset. Add one, then come back."
          action={<LinkButton href="/assets/new">Add an asset</LinkButton>}
        />
      ) : (
        <NewWorkOrderForm
          assets={assets}
          defaultReporter={user.name}
          defaults={{
            assetId: searchParams.asset,
            title: searchParams.title,
            priority: searchParams.priority,
          }}
        />
      )}
    </div>
  );
}
