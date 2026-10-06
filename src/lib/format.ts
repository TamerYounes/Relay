import type { ReviewFinding, ReviewStatus, Severity } from "@/types/relay";

export const severityOrder: Severity[] = ["critical", "high", "medium", "low"];

export function formatStatus(status: ReviewStatus) {
  const labels: Record<ReviewStatus, string> = {
    not_reviewed: "Not reviewed",
    running: "Reviewing",
    failed: "Review failed",
    clean: "Clean",
    reviewed: "Reviewed",
    needs_attention: "Needs attention",
  };

  return labels[status];
}

export function formatSeverity(severity: Severity) {
  const labels: Record<Severity, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return labels[severity];
}

export function compareSeverity(a: Severity, b: Severity) {
  return severityOrder.indexOf(a) - severityOrder.indexOf(b);
}

export function getHighestSeverity(
  findings: Pick<ReviewFinding, "severity">[],
): Severity | null {
  return (
    severityOrder.find((severity) =>
      findings.some((finding) => finding.severity === severity),
    ) ?? null
  );
}

/**
 * Maps a stored review status and its findings to the status shown in the UI.
 */
export function getReviewStatus(
  storedStatus: string | null | undefined,
  findings: Pick<ReviewFinding, "severity">[],
): ReviewStatus {
  if (storedStatus === "running") return "running";
  if (storedStatus === "failed") return "failed";
  if (storedStatus !== "completed") return "not_reviewed";
  if (findings.length === 0) return "clean";

  return findings.some(
    (finding) =>
      finding.severity === "critical" || finding.severity === "high",
  )
    ? "needs_attention"
    : "reviewed";
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

export function formatRelativeTime(value: string, now = Date.now()) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);

  if (Math.abs(seconds) < 60) {
    return "just now";
  }

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, unitSeconds] of relativeUnits) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return "just now";
}

export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

/** Stable DOM id for a changed file, so findings can link to it. */
export function fileAnchorId(path: string) {
  return `file-${path.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
