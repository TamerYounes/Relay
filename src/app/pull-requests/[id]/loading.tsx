import { AppShellFrame } from "@/components/app-shell-frame";
import { PanelSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <AppShellFrame>
      <main className="space-y-6" aria-busy="true" aria-label="Loading pull request">
        <Skeleton className="h-3.5 w-56" />

        <div className="space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-6">
            <PanelSkeleton rows={3} />
            <PanelSkeleton rows={5} />
          </div>

          <div className="space-y-4">
            <div className="space-y-3 surface p-4">
              <Skeleton className="h-4 w-20" />
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-3.5 w-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </AppShellFrame>
  );
}
