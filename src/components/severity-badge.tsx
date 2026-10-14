import type { Severity } from "@/types/relay";
import { formatSeverity } from "@/lib/format";

export const severityStyles: Record<
  Severity,
  { badge: string; dot: string; text: string; bar: string }
> = {
  // Critical is the only filled pill, so it can't be missed in a list.
  critical: {
    badge: "bg-red-600 text-white",
    dot: "bg-white",
    text: "text-red-700",
    bar: "bg-red-600",
  },
  high: {
    badge: "bg-orange-50 text-orange-800 ring-1 ring-inset ring-orange-200",
    dot: "bg-orange-500",
    text: "text-orange-700",
    bar: "bg-orange-500",
  },
  medium: {
    badge: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bar: "bg-amber-400",
  },
  low: {
    badge: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200",
    dot: "bg-zinc-400",
    text: "text-zinc-600",
    bar: "bg-zinc-300",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const styles = severityStyles[severity];

  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold ${styles.badge}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {formatSeverity(severity)}
    </span>
  );
}
