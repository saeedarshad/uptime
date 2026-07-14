import { NextResponse } from "next/server";
import { runNightlyJob } from "@/lib/jobs";

// Triggers the nightly job on demand. Guard with CRON_SECRET so it can't be
// invoked by the public. Accepts `Authorization: Bearer <secret>` or
// `x-cron-secret: <secret>`.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const provided = bearer ?? req.headers.get("x-cron-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runNightlyJob();
  return NextResponse.json({ ok: true, ...result });
}
