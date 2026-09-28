import type { ReviewStatus } from "@/types/relay";
import { formatStatus } from "@/lib/format";

const statusStyles: Record<ReviewStatus, string> = {
  reviewed: "border-zinc-200 bg-zinc-50 text-zinc-600",
  needs_attention: "border-amber-200 bg-amber-50 text-amber-700",
  clean: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${statusStyles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}
