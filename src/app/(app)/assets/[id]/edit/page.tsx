import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { PageHeader } from "@/components/ui";
import { AssetForm } from "@/components/AssetForm";
import { updateAsset } from "../../actions";

export default async function EditAssetPage({
  params,
}: {
  params: { id: string };
}) {
  const { org } = await requireAuth();
  const asset = await tenantDb(org.id).asset.findFirst({
    where: { id: params.id },
  });
  if (!asset) notFound();

  const boundUpdate = updateAsset.bind(null, asset.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Edit ${asset.name}`}
        action={
          <Link href={`/assets/${asset.id}`} className="btn-ghost">
            Cancel
          </Link>
        }
      />
      <AssetForm
        action={boundUpdate}
        submitLabel="Save changes"
        values={{
          name: asset.name,
          category: asset.category,
          location: asset.location,
          status: asset.status,
          purchaseCostCents: asset.purchaseCostCents,
          purchaseDate: asset.purchaseDate?.toISOString() ?? null,
          notes: asset.notes,
          isComplianceTracked: asset.isComplianceTracked,
        }}
      />
    </div>
  );
}
