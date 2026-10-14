import type { Severity } from "@/types/relay";
import { formatSeverity } from "@/lib/format";

export const severityStyles: Record<
  Severity,
  { badge: string; dot: string; text: string; bar: string }
> = {
  // Critical is the only filled pill, so it can't be missed in a list.
  critical: {
    badge: "bg-red-500 text-white shadow-[0_0_16px_-2px_rgb(239_68_68/0.55)]",
    dot: "bg-white",
    text: "text-red-400",
    bar: "bg-red-500",
  },
  high: {
    badge: "bg-orange-500/15 text-orange-300 ring-1 ring-inset ring-orange-400/35",
    dot: "bg-orange-400",
    text: "text-orange-300",
    bar: "bg-orange-500",
  },
  medium: {
    badge: "bg-yellow-400/12 text-yellow-200 ring-1 ring-inset ring-yellow-300/30",
    dot: "bg-yellow-300",
    text: "text-yellow-200",
    bar: "bg-yellow-300",
  },
  low: {
    badge: "bg-surface-3 text-ink-soft ring-1 ring-inset ring-line",
    dot: "bg-ink-faint",
    text: "text-ink-muted",
    bar: "bg-ink-faint",
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
