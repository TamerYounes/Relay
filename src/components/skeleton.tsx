export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-xs bg-zinc-200/80 ${className}`}
    />
  );
}

export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 sm:px-5">
        <Skeleton className="h-3.5 w-32" />
      </div>

      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            <Skeleton className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="hidden h-5 w-24 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
