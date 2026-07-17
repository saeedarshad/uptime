import Link from "next/link";
import { getAuth } from "@/lib/auth";

export const metadata = {
  title: "UptimeHQ — Equipment maintenance for small shops",
  description:
    "Track repairs, get PM reminders, and see which asset is eating your budget. Techs scan a QR to report problems. Flat price, unlimited users.",
};

export default async function Home() {
  // The public marketing page must render even if the session store is
  // unavailable — a failed auth check just means "show the logged-out CTAs".
  const loggedIn = await getAuth()
    .then(Boolean)
    .catch(() => false);

  return (
    <div className="min-h-screen">
      <LandingHeader loggedIn={loggedIn} />
      <Hero loggedIn={loggedIn} />
      <LogoStrip />
      <Features />
      <HowItWorks />
      <Pricing loggedIn={loggedIn} />
      <CtaBand loggedIn={loggedIn} />
      <Footer />
    </div>
  );
}

function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-safety to-safety/80 text-lg font-black text-white shadow-sm ring-1 ring-white/20">
        U
      </div>
      <span
        className={`text-xl font-bold tracking-tight ${dark ? "text-white" : "text-content"}`}
      >
        UptimeHQ
      </span>
    </div>
  );
}

function LandingHeader({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-content/[0.06] bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-content/70 transition-colors hover:text-content"
          >
            Features
          </a>
          <a
            href="#how"
            className="text-sm font-medium text-content/70 transition-colors hover:text-content"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-content/70 transition-colors hover:text-content"
          >
            Pricing
          </a>
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

function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-faint [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-safety/10 blur-3xl"
      />
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-content/10 bg-surface px-3.5 py-1.5 text-xs font-semibold text-content/70 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            Flat price · Unlimited users · No per-seat fees
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-content sm:text-6xl">
            Maintenance tracking your{" "}
            <span className="relative whitespace-nowrap text-safety">
              whole crew
              <svg
                viewBox="0 0 300 12"
                fill="none"
                className="absolute -bottom-1 left-0 w-full"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 9C60 4 120 3 180 5c40 1.5 80 3 118 1"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.35"
                />
              </svg>
            </span>{" "}
            will actually use.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-content/60">
            Techs scan a QR label to report problems. You get PM reminders, cost
            analytics, and plain-English insights on which machine is eating
            your budget.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={loggedIn ? "/dashboard" : "/register"}
              className="btn-primary w-full px-6 py-3 text-base sm:w-auto"
            >
              {loggedIn ? "Go to dashboard" : "Start your 14-day free trial"}
            </Link>
            <a
              href="#how"
              className="btn-secondary w-full px-6 py-3 text-base sm:w-auto"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-content/40">
            No credit card required · Set up in minutes
          </p>
        </div>

        <div className="mt-16">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

// A stylized, code-drawn product preview (no external image needed).
function DashboardPreview() {
  const bars = [38, 52, 44, 68, 90, 58];
  return (
    <div className="mx-auto max-w-4xl">
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
              Vehicle Lift #2 has cost $2,340 in 90 days — 11× your shop average.
            </div>
          </div>
          {[
            { label: "Downtime", value: "41 hrs", tone: "text-content" },
            { label: "Spend (90d)", value: "$3,345", tone: "text-safety" },
            { label: "PM compliance", value: "50%", tone: "text-ok" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-content/[0.08] p-4">
              <div className="text-[11px] font-medium uppercase tracking-wide text-content/50">
                {s.label}
              </div>
              <div className={`mt-1.5 text-2xl font-bold tabular-nums ${s.tone}`}>
                {s.value}
              </div>
            </div>
          ))}
          <div className="rounded-xl border border-content/[0.08] p-4 sm:col-span-3">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-content/50">
              Monthly spend
            </div>
            <div className="flex h-28 items-end gap-3">
              {bars.map((h, i) => (
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
    </div>
  );
}

function LogoStrip() {
  const types = [
    "Auto shops",
    "Machine shops",
    "Gyms",
    "Contractors",
    "Fleets",
  ];
  return (
    <section className="border-y border-content/[0.06] bg-surface/50">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-content/40">
          Built for the shops that keep things running
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {types.map((t) => (
            <span
              key={t}
              className="text-base font-bold tracking-tight text-content/30"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: "QR scan reporting",
    body: "Stick a label on each machine. Techs scan to report a problem in seconds — no app, no login.",
    path: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v6M14 17h6",
  },
  {
    title: "Plain-English insights",
    body: "We flag the asset eating your budget, recurring failures, and expiring certificates — in words, not charts.",
    path: "M3 3v18h18M7 15l4-4 3 3 5-6",
  },
  {
    title: "PM scheduling",
    body: "Time- or meter-based preventive maintenance with automatic reminders so nothing slips.",
    path: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z",
  },
  {
    title: "Cost & downtime analytics",
    body: "See spend by asset and month at a glance, and price downtime against your labor rate.",
    path: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  },
  {
    title: "Compliance & documents",
    body: "Track DOT vehicles and calibrated instruments; store manuals and certificates with expiry alerts.",
    path: "M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Unlimited users",
    body: "Invite your whole team — owners, admins, techs. One flat price, never per seat.",
    path: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow">Everything, nothing extra</div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-content sm:text-4xl">
          The maintenance loop, closed
        </h2>
        <p className="mt-4 text-lg text-content/60">
          Log repairs, get reminders, and see where the money goes — without the
          bloat of enterprise CMMS software.
        </p>
      </div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="card-interactive p-6"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-safety/10 text-safety">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden
              >
                <path d={f.path} />
              </svg>
            </span>
            <h3 className="mt-4 text-base font-bold text-content">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-content/60">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Label your machines",
    body: "Print QR labels for every asset from the dashboard. Peel and stick — two minutes each.",
  },
  {
    n: "02",
    title: "Techs scan & report",
    body: "A scan opens a login-free page to report a problem or log a meter reading from any phone.",
  },
  {
    n: "03",
    title: "You get the signal",
    body: "Work orders, PM reminders, and insights land on your dashboard so you can act before it breaks.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="border-y border-content/[0.06] bg-surface/50">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow">How it works</div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-content sm:text-4xl">
            Up and running today
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative">
              <div className="text-5xl font-black tracking-tight text-safety/20">
                {s.n}
              </div>
              <h3 className="mt-3 text-lg font-bold text-content">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-content/60">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing({ loggedIn }: { loggedIn: boolean }) {
  const includes = [
    "Unlimited users & assets",
    "QR scan reporting",
    "PM scheduling & reminders",
    "Insights & cost analytics",
    "Compliance tracking & PDF export",
    "Email support",
  ];
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <div className="eyebrow">Pricing</div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-content sm:text-4xl">
          One plan. No surprises.
        </h2>
        <p className="mt-4 text-lg text-content/60">
          Flat monthly price for your whole shop. Add every tech, owner, and
          admin — the price never changes.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-content/10 bg-surface shadow-elevated">
          <div className="bg-gradient-to-br from-night to-ink p-8 text-center text-white">
            <div className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Shop plan
            </div>
            <div className="mt-3 flex items-end justify-center gap-1">
              <span className="text-5xl font-black tracking-tight">$49</span>
              <span className="mb-1.5 text-white/50">/ month</span>
            </div>
            <div className="mt-2 text-sm text-white/60">
              Billed monthly · cancel anytime
            </div>
          </div>
          <div className="p-8">
            <ul className="space-y-3">
              {includes.map((i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-content/80">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok/10 text-ok">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                      aria-hidden
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </span>
                  {i}
                </li>
              ))}
            </ul>
            <Link
              href={loggedIn ? "/dashboard" : "/register"}
              className="btn-primary mt-8 w-full py-3 text-base"
            >
              {loggedIn ? "Go to dashboard" : "Start 14-day free trial"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBand({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-night to-ink px-8 py-14 text-center sm:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-safety/20 blur-3xl"
        />
        <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Stop guessing which machine is costing you.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/60">
          Start free today. Have your first QR labels printed before lunch.
        </p>
        <div className="relative mt-8 flex justify-center">
          <Link
            href={loggedIn ? "/dashboard" : "/register"}
            className="btn-primary px-7 py-3 text-base"
          >
            {loggedIn ? "Go to dashboard" : "Start your free trial"}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-content/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row sm:px-8">
        <Wordmark />
        <p className="text-sm text-content/50">
          © {2026} UptimeHQ · Equipment maintenance for small businesses
        </p>
        <div className="flex items-center gap-6 text-sm font-medium text-content/60">
          <Link href="/login" className="hover:text-content">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-content">
            Start free
          </Link>
        </div>
      </div>
    </footer>
  );
}
