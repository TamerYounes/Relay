import type { Severity } from "@/types/relay";
import { formatSeverity } from "@/lib/format";

export const severityStyles: Record<
  Severity,
  { badge: string; dot: string; text: string; border: string; bar: string }
> = {
  // Critical is the only filled tag, so it can't be missed in a list.
  critical: {
    badge: "border-red-700 bg-red-600 text-white",
    dot: "bg-white",
    text: "text-red-700",
    border: "border-l-red-600",
    bar: "bg-red-600",
  },
  high: {
    badge: "border-orange-300 bg-orange-50 text-orange-800",
    dot: "bg-orange-500",
    text: "text-orange-700",
    border: "border-l-orange-500",
    bar: "bg-orange-500",
  },
  medium: {
    badge: "border-amber-300 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    text: "text-amber-700",
    border: "border-l-amber-400",
    bar: "bg-amber-400",
  },
  low: {
    badge: "border-zinc-300 bg-white text-zinc-600",
    dot: "bg-zinc-400",
    text: "text-zinc-600",
    border: "border-l-zinc-300",
    bar: "bg-zinc-400",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const styles = severityStyles[severity];

  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center gap-1.5 rounded-xs border px-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-wide ${styles.badge}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 ${styles.dot}`} />
      {formatSeverity(severity)}
    </span>
  );
}
