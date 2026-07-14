export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-graphite/10 ${className}`} />
  );
}

/** A generic page skeleton: title bar, a row of cards, and a list block. */
export function PageSkeleton() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-56" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="mb-3 h-40" />
      <Skeleton className="h-64" />
    </div>
  );
}
