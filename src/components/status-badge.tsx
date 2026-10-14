import type { ReviewStatus } from "@/types/relay";
import { formatStatus } from "@/lib/format";

const statusStyles: Record<ReviewStatus, { badge: string; dot: string }> = {
  not_reviewed: {
    badge: "bg-zinc-100 text-zinc-600",
    dot: "border border-zinc-400 bg-transparent",
  },
  running: {
    badge: "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200",
    dot: "animate-pulse bg-sky-500",
  },
  failed: {
    badge: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    dot: "bg-red-600",
  },
  clean: {
    badge: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
    dot: "bg-emerald-500",
  },
  reviewed: {
    badge: "bg-zinc-100 text-zinc-700",
    dot: "bg-zinc-500",
  },
  needs_attention: {
    badge: "bg-mark-soft text-zinc-900 ring-1 ring-inset ring-mark",
    dot: "bg-zinc-900",
  },
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles = statusStyles[status];

  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-medium ${styles.badge}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {formatStatus(status)}
    </span>
  );
}
