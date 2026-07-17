import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicAsset } from "@/lib/publicAsset";
import { isPinSatisfied } from "@/lib/pin";
import { tenantDb } from "@/lib/tenant";
import { MeterForm } from "./MeterForm";

export default async function MeterPage({
  params,
}: {
  params: { publicId: string };
}) {
  const asset = await getPublicAsset(params.publicId);
  if (!asset) notFound();
  if (!isPinSatisfied(asset.org)) redirect(`/a/${params.publicId}`);

  const [users, lastReading] = await Promise.all([
    tenantDb(asset.orgId).user.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.meterReading.findFirst({
      where: { assetId: asset.id },
      orderBy: { readAt: "desc" },
      select: { unitLabel: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-5 text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-safety">
          {asset.name}
        </div>
        <h1 className="mt-1 text-xl font-bold text-content">
          Log meter reading
        </h1>
      </div>
      <MeterForm
        publicId={params.publicId}
        names={users.map((u) => u.name)}
        defaultUnit={lastReading?.unitLabel ?? "hours"}
      />
      <div className="mt-4 text-center">
        <Link
          href={`/a/${params.publicId}`}
          className="text-sm text-content/50"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
