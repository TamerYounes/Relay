import { describe, expect, it } from "vitest";
import { formatDuration, getReviewStats, median } from "./stats";

const now = Date.parse("2026-10-10T12:00:00Z");
const hoursAgo = (hours: number) =>
  new Date(now - hours * 60 * 60 * 1000).toISOString();

describe("median", () => {
  it("handles empty, odd and even lists", () => {
    expect(median([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe("getReviewStats", () => {
  it("uses the median time to first review for PRs opened in the last 30 days", () => {
    const stats = getReviewStats(
      [
        { state: "merged", draft: false, opened_at: hoursAgo(50), first_review_at: hoursAgo(48), merged_at: hoursAgo(40) },
        { state: "open", draft: false, opened_at: hoursAgo(30), first_review_at: hoursAgo(24), merged_at: null },
        { state: "open", draft: false, opened_at: hoursAgo(20), first_review_at: hoursAgo(10), merged_at: null },
        { state: "merged", draft: false, opened_at: hoursAgo(24 * 40), first_review_at: hoursAgo(24 * 39), merged_at: hoursAgo(24 * 38) },
      ],
      now,
    );

    expect(stats.medianFirstReviewMs).toBe(6 * 60 * 60 * 1000);
    expect(stats.reviewedSampleSize).toBe(3);
  });

  it("counts open, non-draft PRs with no review after 3 days as waiting", () => {
    const stats = getReviewStats(
      [
        { state: "open", draft: false, opened_at: hoursAgo(24 * 4), first_review_at: null, merged_at: null },
        { state: "open", draft: true, opened_at: hoursAgo(24 * 4), first_review_at: null, merged_at: null },
        { state: "open", draft: false, opened_at: hoursAgo(24), first_review_at: null, merged_at: null },
        { state: "open", draft: false, opened_at: hoursAgo(24 * 5), first_review_at: hoursAgo(24), merged_at: null },
      ],
      now,
    );

    expect(stats.waitingCount).toBe(1);
    expect(stats.medianFirstReviewMs).toBe(4 * 24 * 60 * 60 * 1000);
  });

  it("counts PRs merged in the last 7 days", () => {
    const stats = getReviewStats(
      [
        { state: "merged", draft: false, opened_at: hoursAgo(24 * 8), first_review_at: null, merged_at: hoursAgo(24 * 2) },
        { state: "merged", draft: false, opened_at: hoursAgo(24 * 20), first_review_at: null, merged_at: hoursAgo(24 * 10) },
      ],
      now,
    );

    expect(stats.mergedThisWeek).toBe(1);
    expect(stats.medianFirstReviewMs).toBeNull();
  });
});

describe("formatDuration", () => {
  it("picks a readable unit", () => {
    expect(formatDuration(20 * 1000)).toBe("1m");
    expect(formatDuration(45 * 60 * 1000)).toBe("45m");
    expect(formatDuration(5 * 60 * 60 * 1000)).toBe("5h");
    expect(formatDuration(36 * 60 * 60 * 1000)).toBe("1.5d");
    expect(formatDuration(48 * 60 * 60 * 1000)).toBe("2d");
    expect(formatDuration(12 * 24 * 60 * 60 * 1000)).toBe("12d");
  });
});
