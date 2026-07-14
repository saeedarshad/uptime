import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPublicAsset } from "@/lib/publicAsset";
import { isPinSatisfied } from "@/lib/pin";
import { tenantDb } from "@/lib/tenant";
import { ReportForm } from "./ReportForm";

export default async function ReportPage({
  params,
}: {
  params: { publicId: string };
}) {
  const asset = await getPublicAsset(params.publicId);
  if (!asset) notFound();
  if (!isPinSatisfied(asset.org)) redirect(`/a/${params.publicId}`);

  const users = await tenantDb(asset.orgId).user.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="mb-5 text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-safety">
          {asset.name}
        </div>
        <h1 className="mt-1 text-xl font-bold text-graphite">
          Report a problem
        </h1>
      </div>
      <ReportForm
        publicId={params.publicId}
        symptoms={asset.org.symptomChips}
        names={users.map((u) => u.name)}
      />
      <div className="mt-4 text-center">
        <Link
          href={`/a/${params.publicId}`}
          className="text-sm text-graphite/50"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
