export type Severity = "critical" | "high" | "medium" | "low";

/**
 * Review state for a pull request as shown in the UI. Derived from the
 * `reviews.status` column plus the findings attached to a completed review.
 */
export type ReviewStatus =
  | "not_reviewed"
  | "running"
  | "failed"
  | "clean"
  | "reviewed"
  | "needs_attention";

export type GitHubUser = {
  login: string;
  avatar_url?: string;
};

export type GitHubPullRequest = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  user?: GitHubUser;
  head?: {
    ref: string;
  };
  base?: {
    ref: string;
  };
  created_at: string;
  updated_at: string;
};

export type GitHubFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

export type ReviewFinding = {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  file_path: string;
  line: number | null;
  explanation: string;
  suggestion: string | null;
  code_snippet: string | null;
};

export type PullRequestReview = {
  status: ReviewStatus;
  findingsCount: number;
  highestSeverity: Severity | null;
};
