import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// Serves uploaded photos/documents from the storage driver. Keys are
// unguessable (UUID-based), so this is intentionally unauthenticated to keep
// public report photos viewable; it never lists or enumerates.
export async function GET(
  _req: Request,
  { params }: { params: { key: string[] } },
) {
  const key = params.key.join("/");
  // Guard against path traversal.
  if (key.includes("..")) {
    return new NextResponse("Bad request", { status: 400 });
  }
  try {
    const { data, contentType } = await storage.read(key);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
