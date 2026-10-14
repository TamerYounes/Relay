import type { ReviewStatus } from "@/types/relay";
import { formatStatus } from "@/lib/format";

const statusStyles: Record<ReviewStatus, { badge: string; dot: string }> = {
  not_reviewed: {
    badge: "bg-surface-3 text-ink-muted",
    dot: "border border-line-strong bg-transparent",
  },
  running: {
    badge: "bg-sky-400/12 text-sky-300 ring-1 ring-inset ring-sky-400/30",
    dot: "animate-pulse bg-sky-400",
  },
  failed: {
    badge: "bg-red-500/12 text-red-300 ring-1 ring-inset ring-red-400/35",
    dot: "bg-red-400",
  },
  clean: {
    badge: "bg-emerald-400/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/30",
    dot: "bg-emerald-400",
  },
  reviewed: {
    badge: "bg-surface-3 text-ink-soft",
    dot: "bg-ink-faint",
  },
  needs_attention: {
    badge: "bg-accent/12 text-accent ring-1 ring-inset ring-accent/40",
    dot: "bg-accent",
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
