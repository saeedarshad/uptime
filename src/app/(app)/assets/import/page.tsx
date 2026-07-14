import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ImportForm } from "./ImportForm";

export default async function ImportAssetsPage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Import assets"
        subtitle="Bulk-add equipment for fast onboarding."
        action={
          <Link href="/assets" className="btn-ghost">
            Cancel
          </Link>
        }
      />
      <ImportForm />
    </div>
  );
}
