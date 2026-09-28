export type ReviewStatus = "reviewed" | "needs_attention" | "clean" | "failed";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type FindingCategory =
  | "bug"
  | "security"
  | "code_quality"
  | "maintainability"
  | "test_coverage";

export type ChangedFile = {
  path: string;
  language: string;
  additions: number;
  deletions: number;
  status: "modified" | "added" | "deleted";
  findings: number;
};

export type Finding = {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  filePath: string;
  line: number;
  confidence: "high" | "medium" | "low";
  explanation: string;
  suggestion: string;
  codeSnippet: string;
};

export type PullRequest = {
  id: string;
  number: number;
  title: string;
  repository: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  status: ReviewStatus;
  severity: Severity;
  reviewedAt: string;
  reviewDuration: string;
  summary: string;
  files: ChangedFile[];
  findings: Finding[];
};
