import { AppShellFrame } from "@/components/app-shell-frame";
import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <AppShellFrame>
      <main className="max-w-3xl space-y-6" aria-busy="true" aria-label="Loading settings">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>

        {[2, 3, 1].map((rows, index) => (
          <div
            key={index}
            className="overflow-hidden rounded border border-zinc-200 bg-white"
          >
            <div className="space-y-2 border-b border-zinc-200 px-4 py-3 sm:px-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <div className="divide-y divide-zinc-100">
              {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="flex justify-between gap-4 px-4 py-3.5 sm:px-5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-36" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </AppShellFrame>
  );
}
