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
      <div className="card mb-5 flex items-center justify-between p-4 text-sm">
        <span className="text-graphite/60">Last serviced</span>
        <span className="font-semibold text-graphite">
          {serviced ? formatDate(serviced, asset.org.timezone) : "No record yet"}
        </span>
      </div>
      <div className="space-y-3">
        <Link
          href={`/a/${params.publicId}/report`}
          className="group flex w-full items-center gap-4 rounded-xl bg-safety p-4 text-left text-white shadow-card ring-1 ring-inset ring-white/10 transition-all active:translate-y-px"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
              <path d="M12 9v4m0 4h.01M10.3 3.9l-8 14A2 2 0 004 21h16a2 2 0 001.7-3l-8-14a2 2 0 00-3.4 0z" />
            </svg>
          </span>
          <span className="flex-1">
            <span className="block text-base font-bold">Report a problem</span>
            <span className="block text-sm text-white/75">
              Something broken or not right
            </span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white/60 transition-transform group-active:translate-x-0.5" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
        <Link
          href={`/a/${params.publicId}/meter`}
          className="group flex w-full items-center gap-4 rounded-xl border border-graphite/15 bg-white p-4 text-left text-graphite shadow-card transition-all active:translate-y-px"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-graphite/[0.06] text-graphite/70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <span className="flex-1">
            <span className="block text-base font-bold">Log meter reading</span>
            <span className="block text-sm text-graphite/55">
              Hours, mileage, or cycles
            </span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-graphite/30 transition-transform group-active:translate-x-0.5" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
