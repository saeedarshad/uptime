import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { assetQrDataUrl, assetPublicUrl } from "@/lib/qr";
import { QrLabel } from "@/components/QrLabel";
import { PrintButton } from "@/components/PrintButton";

export default async function SingleLabelPage({
  params,
}: {
  params: { id: string };
}) {
  const { org } = await requireAuth();
  const asset = await tenantDb(org.id).asset.findFirst({
    where: { id: params.id },
  });
  if (!asset) notFound();

  const qr = await assetQrDataUrl(asset.publicId);

  return (
    <div className="mx-auto max-w-md">
      <div className="no-print mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-content">Label · {asset.name}</h1>
        <div className="flex gap-2">
          <Link href={`/assets/${asset.id}`} className="btn-ghost">
            Back
          </Link>
          <PrintButton />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <QrLabel
          assetName={asset.name}
          orgName={org.name}
          location={asset.location}
          qrDataUrl={qr}
        />
        <p className="no-print break-all text-center text-xs text-content/40">
          {assetPublicUrl(asset.publicId)}
        </p>
      </div>
    </div>
  );
}
