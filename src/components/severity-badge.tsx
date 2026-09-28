import type { Severity } from "@/types/relay";
import { formatSeverity } from "@/lib/format";

const severityStyles: Record<Severity, string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-zinc-200 bg-zinc-50 text-zinc-600",
  info: "border-zinc-200 bg-zinc-50 text-zinc-500",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${severityStyles[severity]}`}
    >
      {formatSeverity(severity)}
    </span>
  );
}

