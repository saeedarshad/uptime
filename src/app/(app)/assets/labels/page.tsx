import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { assetQrDataUrl } from "@/lib/qr";
import { QrLabel } from "@/components/QrLabel";
import { PrintButton } from "@/components/PrintButton";
import { EmptyState, LinkButton } from "@/components/ui";

export default async function LabelSheetPage() {
  const { org } = await requireAuth();
  const assets = await tenantDb(org.id).asset.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
  });

  const labels = await Promise.all(
    assets.map(async (a) => ({
      id: a.id,
      name: a.name,
      location: a.location,
      qr: await assetQrDataUrl(a.publicId),
    })),
  );

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content">
            QR labels
          </h1>
          <p className="mt-1 text-sm text-content/60">
            2&quot;×2&quot; labels. Print, peel, and stick one on each machine.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/assets" className="btn-ghost">
            Back
          </Link>
          <PrintButton label="Print labels" />
        </div>
      </div>

      {labels.length === 0 ? (
        <EmptyState
          title="No assets to label"
          body="Add assets first, then come back to print their QR labels."
          action={<LinkButton href="/assets/new">Add an asset</LinkButton>}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {labels.map((l) => (
            <QrLabel
              key={l.id}
              assetName={l.name}
              orgName={org.name}
              location={l.location}
              qrDataUrl={l.qr}
            />
          ))}
        </div>
      )}
    </div>
  );
}
