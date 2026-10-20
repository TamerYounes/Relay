import { describe, expect, it } from "vitest";
import {
  compareSeverity,
  fileAnchorId,
  formatRelativeTime,
  getHighestSeverity,
  getReviewStatus,
  pluralize,
} from "./format";

describe("getReviewStatus", () => {
  it("passes through running and failed", () => {
    expect(getReviewStatus("running", [])).toBe("running");
    expect(getReviewStatus("failed", [{ severity: "critical" }])).toBe("failed");
  });

  it("treats anything but a completed review as not reviewed", () => {
    expect(getReviewStatus(null, [])).toBe("not_reviewed");
    expect(getReviewStatus("pending", [])).toBe("not_reviewed");
  });

  it("grades completed reviews by their worst finding", () => {
    expect(getReviewStatus("completed", [])).toBe("clean");
    expect(getReviewStatus("completed", [{ severity: "low" }])).toBe("reviewed");
    expect(getReviewStatus("completed", [{ severity: "medium" }])).toBe("reviewed");
    expect(
      getReviewStatus("completed", [{ severity: "low" }, { severity: "high" }]),
    ).toBe("needs_attention");
  });
});

describe("severity helpers", () => {
  it("finds the highest severity", () => {
    expect(getHighestSeverity([])).toBeNull();
    expect(
      getHighestSeverity([{ severity: "low" }, { severity: "critical" }]),
    ).toBe("critical");
  });

  it("sorts critical first", () => {
    expect(
      (["low", "critical", "medium", "high"] as const)
        .slice()
        .sort(compareSeverity),
    ).toEqual(["critical", "high", "medium", "low"]);
  });
});

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-10-20T12:00:00Z");

  it("says just now under a minute", () => {
    expect(formatRelativeTime("2026-10-20T11:59:30Z", now)).toBe("just now");
  });

  it("uses the largest whole unit", () => {
    expect(formatRelativeTime("2026-10-20T09:00:00Z", now)).toBe("3 hours ago");
    expect(formatRelativeTime("2026-10-19T12:00:00Z", now)).toBe("yesterday");
  });
});

describe("small formatters", () => {
  it("pluralizes", () => {
    expect(pluralize(1, "file")).toBe("1 file");
    expect(pluralize(2, "file")).toBe("2 files");
    expect(pluralize(0, "query", "queries")).toBe("0 queries");
  });

  it("builds stable anchor ids from file paths", () => {
    expect(fileAnchorId("src/app/page.tsx")).toBe("file-src-app-page-tsx");
    expect(fileAnchorId("/weird//path/")).toBe("file-weird-path");
  });
});
