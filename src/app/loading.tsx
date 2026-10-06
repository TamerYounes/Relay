import { AppShellFrame } from "@/components/app-shell-frame";
import { PanelSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <AppShellFrame>
      <main className="space-y-6" aria-busy="true" aria-label="Loading pull requests">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded border border-zinc-200 bg-zinc-200 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2.5 bg-white px-4 py-4 sm:px-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>

        <PanelSkeleton rows={6} />
      </main>
    </AppShellFrame>
  );
}
