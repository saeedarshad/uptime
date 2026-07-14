import QRCode from "qrcode";

/** Base URL used to build public asset links encoded in QR codes. */
export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function assetPublicUrl(publicId: string): string {
  return `${appUrl()}/a/${publicId}`;
}

/** Render a QR code for an asset's public URL as a PNG data URL (for print). */
export async function assetQrDataUrl(publicId: string): Promise<string> {
  return QRCode.toDataURL(assetPublicUrl(publicId), {
    margin: 1,
    width: 320,
    errorCorrectionLevel: "M",
  });
}
