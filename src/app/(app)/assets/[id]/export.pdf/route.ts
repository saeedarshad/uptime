import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { generateAssetHistoryPdf } from "@/lib/pdf";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await getAuth();
  if (!auth) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    // Scoped to the caller's org — a foreign asset id yields "not found".
    const bytes = await generateAssetHistoryPdf(auth.org.id, params.id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=asset-history.pdf",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
