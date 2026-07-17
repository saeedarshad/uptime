import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { AssetForm } from "@/components/AssetForm";
import { createAsset } from "../actions";

export default async function NewAssetPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Add asset"
        breadcrumbs={[{ label: "Assets", href: "/assets" }]}
        action={
          <Link href="/assets" className="btn-ghost">
            Cancel
          </Link>
        }
      />
      <AssetForm action={createAsset} submitLabel="Create asset" />
    </div>
  );
}
