import { NextResponse } from "next/server";

// PWA manifest served dynamically (no build-time static asset needed).
export function GET() {
  return NextResponse.json({
    name: "UptimeHQ",
    short_name: "UptimeHQ",
    description: "Equipment maintenance tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F4F0",
    theme_color: "#242B33",
    icons: [],
  });
}
