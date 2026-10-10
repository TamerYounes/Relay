import { describe, expect, it } from "vitest";
import { earlierDate, getFirstReviewAt, toPullRequestRow } from "./sync";

const pullRequest = {
  number: 12,
  title: "Add retry to webhook handler",
  state: "closed" as const,
  draft: false,
  user: { login: "tamer" },
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-03T10:00:00Z",
  closed_at: "2026-10-03T10:00:00Z",
  merged_at: "2026-10-03T10:00:00Z",
};

describe("toPullRequestRow", () => {
  it("marks merged PRs as merged", () => {
    const row = toPullRequestRow("repo-1", pullRequest);

    expect(row.state).toBe("merged");
    expect(row.author_login).toBe("tamer");
    expect(row.opened_at).toBe(pullRequest.created_at);
  });

  it("keeps closed PRs without a merge as closed", () => {
    expect(toPullRequestRow("repo-1", { ...pullRequest, merged_at: null }).state).toBe("closed");
  });
});

describe("getFirstReviewAt", () => {
  it("ignores pending reviews and the author's own comments", () => {
    const first = getFirstReviewAt(
      [
        { state: "COMMENTED", submitted_at: "2026-10-01T11:00:00Z", user: { login: "tamer" } },
        { state: "PENDING", submitted_at: null, user: { login: "sam" } },
        { state: "CHANGES_REQUESTED", submitted_at: "2026-10-02T09:00:00Z", user: { login: "sam" } },
        { state: "APPROVED", submitted_at: "2026-10-01T15:00:00Z", user: { login: "lee" } },
      ],
      "tamer",
    );

    expect(first).toBe("2026-10-01T15:00:00Z");
  });

  it("returns null with no counted reviews", () => {
    expect(getFirstReviewAt([], "tamer")).toBeNull();
  });
});

describe("earlierDate", () => {
  it("keeps the earlier timestamp", () => {
    expect(earlierDate(null, "2026-10-02T00:00:00Z")).toBe("2026-10-02T00:00:00Z");
    expect(earlierDate("2026-10-01T00:00:00Z", "2026-10-02T00:00:00Z")).toBe("2026-10-01T00:00:00Z");
    expect(earlierDate("2026-10-03T00:00:00Z", "2026-10-02T00:00:00Z")).toBe("2026-10-02T00:00:00Z");
  });
});
