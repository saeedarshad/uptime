// Public (no-login) scan flow. Deliberately minimal: no app nav or auth.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-6">{children}</div>
      <footer className="pb-6 text-center text-xs text-graphite/40">
        Powered by UptimeHQ
      </footer>
    </div>
  );
}
