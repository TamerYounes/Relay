import type { ReviewStatus } from "@/types/relay";
import { formatStatus } from "@/lib/format";

const statusStyles: Record<ReviewStatus, { badge: string; dot: string }> = {
  // Dashed outline reads as "pending" without needing color.
  not_reviewed: {
    badge: "border-dashed border-zinc-300 bg-transparent text-zinc-500",
    dot: "border border-zinc-400",
  },
  running: {
    badge: "border-sky-300 bg-sky-50 text-sky-800",
    dot: "animate-pulse bg-sky-500",
  },
  failed: {
    badge: "border-red-300 bg-red-50 text-red-700",
    dot: "bg-red-600",
  },
  clean: {
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-600",
  },
  reviewed: {
    badge: "border-zinc-300 bg-zinc-100 text-zinc-700",
    dot: "bg-zinc-500",
  },
  needs_attention: {
    badge: "border-amber-300 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles = statusStyles[status];

  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center gap-1.5 rounded-xs border px-1.5 text-[11.5px] font-medium ${styles.badge}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {formatStatus(status)}
    </span>
  );
}
