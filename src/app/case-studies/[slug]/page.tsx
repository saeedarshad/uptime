import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAuth } from "@/lib/auth";
import {
  CASE_STUDIES,
  getCaseStudy,
  type Metric,
} from "@/lib/caseStudies";
import {
  CaseFooter,
  CaseHeader,
  DashboardMock,
  PhoneScanMock,
} from "../parts";

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const study = getCaseStudy(params.slug);
  if (!study) return { title: "Case study — UptimeHQ" };
  return {
    title: `${study.industry} case study — UptimeHQ`,
    description: study.subhead,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: { slug: string };
}) {
  const study = getCaseStudy(params.slug);
  if (!study) notFound();

  const loggedIn = await getAuth()
    .then(Boolean)
    .catch(() => false);

  const others = CASE_STUDIES.filter((c) => c.slug !== study.slug);

  return (
    <div className="min-h-screen">
      <CaseHeader loggedIn={loggedIn} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-content/[0.06]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-safety/10 blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
          <Link
            href="/#industries"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-content/50 transition-colors hover:text-content"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All case studies
          </Link>

          <div className="mt-6 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-content/10 bg-surface px-3.5 py-1.5 text-xs font-semibold text-content/70 shadow-sm">
                <span className="text-base leading-none">{study.emoji}</span>
                {study.industry} · Customer story
              </span>
              <h1 className="mt-5 text-3xl font-bold leading-[1.1] tracking-tight text-content sm:text-5xl">
                {study.headline}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-content/60">
                {study.subhead}
              </p>
              <div className="mt-6 rounded-xl border border-content/[0.08] bg-surface/60 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-content/40">
                  The business
                </div>
                <div className="mt-1 text-base font-bold text-content">
                  {study.business.name}
                </div>
                <div className="text-sm text-content/60">
                  {study.business.profile}
                </div>
              </div>
            </div>
            <DashboardMock study={study} />
          </div>
        </div>
      </section>

      {/* Results band */}
      <section className="border-b border-content/[0.06] bg-surface/50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">The results</div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-content sm:text-3xl">
              What tracking maintenance actually saved
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {study.results.map((r) => (
              <ResultCard key={r.label} metric={r} />
            ))}
          </div>
        </div>
      </section>

      {/* Challenge */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="eyebrow">Before UptimeHQ</div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-content sm:text-3xl">
              The problem
            </h2>
            <div className="mt-5 space-y-4">
              {study.challenge.map((p, i) => (
                <p key={i} className="text-base leading-relaxed text-content/70">
                  {p}
                </p>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow">What they track</div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-content sm:text-3xl">
              The equipment
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {study.assets.map((a) => (
                <div
                  key={a.name}
                  className="rounded-xl border border-content/[0.08] bg-surface p-4"
                >
                  <div className="text-sm font-bold text-content">{a.name}</div>
                  <div className="mt-0.5 text-xs text-content/50">{a.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How they use it + phone mock */}
      <section className="border-y border-content/[0.06] bg-surface/50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">A day with UptimeHQ</div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-content sm:text-3xl">
              How {study.business.name} uses it
            </h2>
          </div>
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_auto]">
            <ol className="space-y-6">
              {study.workflow.map((w, i) => (
                <li key={w.title} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-safety/10 text-sm font-bold text-safety">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-content">{w.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-content/60">
                      {w.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="lg:pt-2">
              <PhoneScanMock study={study} />
              <p className="mt-3 text-center text-xs text-content/40">
                The login-free scan a tech sees
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Savings breakdown */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow">Where the savings come from</div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Before &amp; after, line by line
          </h2>
        </div>
        <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-content/10 bg-surface shadow-card">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b border-content/[0.06] bg-content/[0.02] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-content/40 sm:gap-x-8">
            <span>Measure</span>
            <span className="text-right">Before</span>
            <span className="text-right">With UptimeHQ</span>
          </div>
          {study.breakdown.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-5 py-3.5 text-sm sm:gap-x-8 ${
                i > 0 ? "border-t border-content/[0.05]" : ""
              }`}
            >
              <span className="font-medium text-content">{row.label}</span>
              <span className="text-right text-content/50 line-through decoration-danger/40">
                {row.before}
              </span>
              <span className="text-right font-bold text-ok">{row.after}</span>
            </div>
          ))}
        </div>

        {/* Quote */}
        <figure className="mx-auto mt-12 max-w-3xl rounded-2xl border border-content/[0.08] bg-surface p-8 text-center shadow-card">
          <blockquote className="text-lg font-medium leading-relaxed text-content sm:text-xl">
            “{study.quote.text}”
          </blockquote>
          <figcaption className="mt-4 text-sm text-content/50">
            — {study.quote.who}
          </figcaption>
        </figure>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-night to-ink px-8 py-14 text-center sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-safety/20 blur-3xl"
          />
          <h2 className="relative text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Picture this for your {study.industry.toLowerCase()}.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/60">
            Start free, label your first machines before lunch, and see your own
            numbers instead of ours.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={loggedIn ? "/dashboard" : "/register"}
              className="btn-primary px-7 py-3 text-base"
            >
              {loggedIn ? "Go to dashboard" : "Start your free trial"}
            </Link>
            <Link href="/#industries" className="btn-ghost px-7 py-3 text-base text-white hover:bg-white/10">
              See other industries
            </Link>
          </div>
        </div>
      </section>

      {/* Other case studies */}
      <section className="border-t border-content/[0.06] bg-surface/50">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <h2 className="text-xl font-bold tracking-tight text-content">
            More industries
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((c) => (
              <Link
                key={c.slug}
                href={`/case-studies/${c.slug}`}
                className="card-interactive p-5"
              >
                <span className="text-2xl">{c.emoji}</span>
                <div className="mt-3 text-sm font-bold text-content">
                  {c.industry}
                </div>
                <div className="mt-1 text-xs leading-relaxed text-content/50">
                  {c.cardStat}
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-safety">
                  Read case study
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CaseFooter />
    </div>
  );
}

function ResultCard({ metric }: { metric: Metric }) {
  return (
    <div className="rounded-2xl border border-content/[0.08] bg-surface p-5 shadow-card">
      <div className="text-3xl font-black tracking-tight text-safety tabular-nums">
        {metric.value}
      </div>
      <div className="mt-2 text-sm font-bold text-content">{metric.label}</div>
      <div className="mt-0.5 text-xs text-content/50">{metric.sub}</div>
    </div>
  );
}

