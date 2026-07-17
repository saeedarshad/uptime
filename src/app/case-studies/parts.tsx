import Link from "next/link";
import type { CaseStudy } from "@/lib/caseStudies";

// Shared marketing chrome + stylized, code-drawn "screenshots" for the case
// study pages. Presentational only — no external images, matching the
// DashboardPreview pattern on the landing page.

export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-safety to-safety/80 text-lg font-black text-white shadow-sm ring-1 ring-white/20">
        U
      </div>
      <span className="text-xl font-bold tracking-tight text-content">
        UptimeHQ
      </span>
    </div>
  );
}

export function CaseHeader({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-content/[0.06] bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#industries"
            className="text-sm font-medium text-content/70 transition-colors hover:text-content"
          >
            Case studies
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-content/70 transition-colors hover:text-content"
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-medium text-content/70 transition-colors hover:text-content"
          >
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Link href="/dashboard" className="btn-primary">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function CaseFooter() {
  return (
    <footer className="border-t border-content/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row sm:px-8">
        <Wordmark />
        <p className="text-sm text-content/50">
          © {2026} UptimeHQ · Equipment maintenance for small businesses
        </p>
        <div className="flex items-center gap-6 text-sm font-medium text-content/60">
          <Link href="/#industries" className="hover:text-content">
            Case studies
          </Link>
          <Link href="/register" className="hover:text-content">
            Start free
          </Link>
        </div>
      </div>
    </footer>
  );
}

// A stylized dashboard "screenshot", fed by a case study's own numbers.
export function DashboardMock({ study }: { study: CaseStudy }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-content/10 bg-surface shadow-elevated">
      <div className="flex items-center gap-1.5 border-b border-content/[0.06] bg-content/[0.02] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-danger/40" />
        <span className="h-3 w-3 rounded-full bg-warn/40" />
        <span className="h-3 w-3 rounded-full bg-ok/40" />
        <span className="ml-3 rounded-md bg-content/[0.05] px-3 py-1 text-[11px] font-medium text-content/40">
          app.uptimehq.app/dashboard
        </span>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <div className="rounded-xl border border-danger/20 bg-danger/[0.05] p-4 sm:col-span-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-danger">
            Critical insight
          </div>
          <div className="mt-1 text-sm font-semibold text-content">
            {study.insight}
          </div>
        </div>
        {study.dashKpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-content/[0.08] p-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-content/50">
              {k.label}
            </div>
            <div className="mt-1.5 text-2xl font-bold tabular-nums text-content">
              {k.value}
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-content/[0.08] p-4 sm:col-span-3">
          <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-content/50">
            Monthly spend
          </div>
          <div className="flex h-24 items-end gap-3">
            {study.spendBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-safety/80 to-safety"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// A stylized phone "screenshot" of the login-free QR scan report flow.
export function PhoneScanMock({ study }: { study: CaseStudy }) {
  return (
    <div className="mx-auto w-full max-w-[15rem]">
      <div className="overflow-hidden rounded-[2rem] border-[6px] border-night bg-surface shadow-elevated">
        <div className="flex items-center justify-between border-b border-content/[0.06] bg-content/[0.02] px-4 py-2.5">
          <span className="text-[10px] font-semibold text-content/40">9:41</span>
          <span className="rounded bg-ok/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ok">
            No login
          </span>
        </div>
        <div className="p-4">
          <div className="text-[10px] font-medium uppercase tracking-wide text-content/40">
            Report a problem
          </div>
          <div className="mt-1 text-sm font-bold text-content">
            {study.scan.asset}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Won't turn on", study.scan.symptom, "Leaking"].map((chip) => (
              <span
                key={chip}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                  chip === study.scan.symptom
                    ? "border-safety bg-safety/10 text-safety"
                    : "border-content/15 text-content/50"
                }`}
              >
                {chip}
              </span>
            ))}
          </div>
          <div className="mt-3 h-14 rounded-lg border border-dashed border-content/15 bg-content/[0.02] p-2 text-[10px] text-content/30">
            Add a photo or note…
          </div>
          <div className="mt-3 rounded-lg bg-safety py-2 text-center text-[11px] font-bold text-white">
            Send report
          </div>
        </div>
      </div>
    </div>
  );
}
