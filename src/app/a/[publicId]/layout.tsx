// Public (no-login) scan flow. Deliberately minimal: no app nav or auth.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
        <div className="flex-1 animate-fade-in-up">{children}</div>
      </div>
      <footer className="pb-7 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-content/40">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br from-safety to-safety/80 text-[9px] font-black text-white">
            U
          </span>
          Powered by UptimeHQ
        </div>
      </footer>
    </div>
  );
}
