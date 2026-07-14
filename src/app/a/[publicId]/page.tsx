import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicAsset, lastServiceAt } from "@/lib/publicAsset";
import { isPinSatisfied } from "@/lib/pin";
import { formatDate } from "@/lib/format";
import { formatWoNumber } from "@/lib/workorders";
import { PinForm } from "./PinForm";

export default async function PublicAssetPage({
  params,
  searchParams,
}: {
  params: { publicId: string };
  searchParams: { done?: string; wo?: string };
}) {
  const asset = await getPublicAsset(params.publicId);
  if (!asset) notFound();

  const AssetHeader = (
    <div className="mb-6 text-center">
      <div className="text-xs font-semibold uppercase tracking-wide text-safety">
        {asset.org.name}
      </div>
      <h1 className="mt-1 text-2xl font-bold text-graphite">{asset.name}</h1>
      {asset.location && (
        <div className="mt-1 text-sm text-graphite/60">{asset.location}</div>
      )}
    </div>
  );

  // Confirmation screen after a submit.
  if (searchParams.done) {
    const isReport = searchParams.done === "report";
    return (
      <div>
        {AssetHeader}
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ok/15 text-3xl text-ok">
            ✓
          </div>
          <h2 className="text-lg font-bold text-graphite">
            {isReport ? "Problem reported" : "Reading logged"}
          </h2>
          <p className="text-sm text-graphite/60">
            {isReport
              ? `Thanks — the shop has been notified${
                  searchParams.wo
                    ? ` (${formatWoNumber(Number(searchParams.wo))})`
                    : ""
                }.`
              : "Thanks — your meter reading was saved."}
          </p>
          <Link href={`/a/${params.publicId}`} className="btn-secondary mt-2">
            Done
          </Link>
        </div>
      </div>
    );
  }

  // PIN gate.
  if (!isPinSatisfied(asset.org)) {
    return (
      <div>
        {AssetHeader}
        <PinForm publicId={params.publicId} />
      </div>
    );
  }

  const serviced = await lastServiceAt(asset.id);

  return (
    <div>
      {AssetHeader}
      <div className="card mb-4 p-4 text-center text-sm text-graphite/70">
        Last serviced:{" "}
        <span className="font-semibold text-graphite">
          {serviced ? formatDate(serviced, asset.org.timezone) : "No record yet"}
        </span>
      </div>
      <div className="space-y-3">
        <Link
          href={`/a/${params.publicId}/report`}
          className="btn-primary w-full py-4 text-base"
        >
          Report a problem
        </Link>
        <Link
          href={`/a/${params.publicId}/meter`}
          className="btn-secondary w-full py-4 text-base"
        >
          Log meter reading
        </Link>
      </div>
    </div>
  );
}
