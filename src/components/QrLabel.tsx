import Image from "next/image";

// A single 2"×2" printable label: asset name + QR + org name.
export function QrLabel({
  assetName,
  orgName,
  location,
  qrDataUrl,
}: {
  assetName: string;
  orgName: string;
  location?: string | null;
  qrDataUrl: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-between rounded-md border border-graphite/20 bg-white p-2 text-center"
      style={{ width: "2in", height: "2in" }}
    >
      <div className="w-full truncate text-[11px] font-bold leading-tight text-graphite">
        {assetName}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <Image
        src={qrDataUrl}
        alt={`QR for ${assetName}`}
        width={120}
        height={120}
        unoptimized
        style={{ width: "1.25in", height: "1.25in" }}
      />
      <div className="w-full truncate text-[8px] uppercase tracking-wide text-graphite/50">
        {location ? `${location} · ` : ""}
        {orgName}
      </div>
    </div>
  );
}
