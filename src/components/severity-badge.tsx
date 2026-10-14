import type { Severity } from "@/types/relay";
import { formatSeverity } from "@/lib/format";

export const severityStyles: Record<
  Severity,
  { badge: string; text: string; bar: string }
> = {
  // Critical is the only filled tag, so it can't be missed in a list.
  critical: {
    badge: "bg-red-500/90 text-white",
    text: "text-red-400",
    bar: "bg-red-500",
  },
  high: {
    badge: "bg-orange-500/15 text-orange-300",
    text: "text-orange-300",
    bar: "bg-orange-500",
  },
  medium: {
    badge: "bg-yellow-400/12 text-yellow-200",
    text: "text-yellow-200",
    bar: "bg-yellow-300",
  },
  low: {
    badge: "bg-surface-3 text-ink-soft",
    text: "text-ink-muted",
    bar: "bg-ink-faint",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const styles = severityStyles[severity];

  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[12px] font-semibold ${styles.badge}`}
    >
      {formatSeverity(severity)}
    </span>
  );
}
