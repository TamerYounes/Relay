import { AppShellFrame } from "@/components/app-shell-frame";
import { PanelSkeleton, Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <AppShellFrame>
      <main className="space-y-9" aria-busy="true" aria-label="Loading pull requests">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        <PanelSkeleton rows={6} />
      </main>
    </AppShellFrame>
  );
}
