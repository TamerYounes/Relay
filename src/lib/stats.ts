const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const STALE_AFTER_DAYS = 3;

export type PullRequestHistory = {
  state: "open" | "closed" | "merged";
  draft: boolean;
  opened_at: string;
  first_review_at: string | null;
  merged_at: string | null;
};

export type ReviewStats = {
  medianFirstReviewMs: number | null;
  reviewedSampleSize: number;
  waitingCount: number;
  mergedThisWeek: number;
};

export function median(values: number[]) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function getReviewStats(
  pullRequests: PullRequestHistory[],
  now = Date.now(),
): ReviewStats {
  const reviewTimes = pullRequests
    .filter(
      (pullRequest) =>
        pullRequest.first_review_at &&
        now - Date.parse(pullRequest.opened_at) <= 30 * DAY,
    )
    .map(
      (pullRequest) =>
        Date.parse(pullRequest.first_review_at as string) -
        Date.parse(pullRequest.opened_at),
    )
    .filter((ms) => ms >= 0);

  const waitingCount = pullRequests.filter(
    (pullRequest) =>
      pullRequest.state === "open" &&
      !pullRequest.draft &&
      !pullRequest.first_review_at &&
      now - Date.parse(pullRequest.opened_at) >= STALE_AFTER_DAYS * DAY,
  ).length;

  const mergedThisWeek = pullRequests.filter(
    (pullRequest) =>
      pullRequest.merged_at &&
      now - Date.parse(pullRequest.merged_at) <= 7 * DAY,
  ).length;

  return {
    medianFirstReviewMs: median(reviewTimes),
    reviewedSampleSize: reviewTimes.length,
    waitingCount,
    mergedThisWeek,
  };
}

export function formatDuration(ms: number) {
  if (ms < HOUR) {
    return `${Math.max(1, Math.round(ms / 60000))}m`;
  }

  if (ms < DAY) {
    return `${Math.round(ms / HOUR)}h`;
  }

  const days = ms / DAY;
  return `${days < 10 ? days.toFixed(1).replace(/\.0$/, "") : Math.round(days)}d`;
}
