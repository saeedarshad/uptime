export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Ambient brand glow behind the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-safety/10 blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-safety to-safety/80 text-xl font-black text-white shadow-card ring-1 ring-white/20">
              U
            </div>
            <span className="text-2xl font-bold tracking-tight text-content">
              UptimeHQ
            </span>
          </div>
          <p className="mt-3 text-sm text-content/55">
            Equipment maintenance, minus the spreadsheets.
          </p>
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-content/40">
          Unlimited users · No per-seat pricing · Cancel anytime
        </p>
      </div>
    </div>
  );
}
