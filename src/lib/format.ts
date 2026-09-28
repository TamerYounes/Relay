import type { FindingCategory, ReviewStatus, Severity } from "@/types/relay";

export function formatStatus(status: ReviewStatus) {
  const labels: Record<ReviewStatus, string> = {
    reviewed: "Reviewed",
    needs_attention: "Needs attention",
    clean: "Clean",
    failed: "Review failed",
  };

  return labels[status];
}

export function formatSeverity(severity: Severity) {
  const labels: Record<Severity, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    info: "Info",
  };

  return labels[severity];
}

export function formatCategory(category: FindingCategory) {
  const labels: Record<FindingCategory, string> = {
    bug: "Bug",
    security: "Security",
    code_quality: "Code quality",
    maintainability: "Maintainability",
    test_coverage: "Test coverage",
  };

  return labels[category];
}

export function formatReviewedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getTotalChanges(additions: number, deletions: number) {
  return additions + deletions;
}
