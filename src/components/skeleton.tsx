export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-sm bg-zinc-200/70 ${className}`}
    />
  );
}

export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-4 w-32" />
      <div className="surface overflow-hidden">

      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="hidden h-5 w-24 md:block" />
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
