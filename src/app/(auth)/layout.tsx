export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-safety text-lg font-bold text-white">
            U
          </div>
          <span className="text-xl font-bold tracking-tight text-graphite">
            UptimeHQ
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
