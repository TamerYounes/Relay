import type { ReviewStatus } from "@/types/relay";
import { formatStatus } from "@/lib/format";

const statusStyles: Record<ReviewStatus, string> = {
  not_reviewed: "text-ink-faint",
  running: "animate-pulse text-sky-300",
  failed: "text-red-300",
  clean: "text-emerald-400",
  reviewed: "text-ink-muted",
  needs_attention: "text-accent",
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap text-[13px] font-medium ${statusStyles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}
