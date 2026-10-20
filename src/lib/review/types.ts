import type { Severity } from "@/types/relay";

/** A changed file as returned by GitHub's pull request files endpoint. */
export type ChangedFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
};

/** A finding before it's saved, so it has no id yet. */
export type Finding = {
  severity: Severity;
  category: string;
  title: string;
  file_path: string;
  line: number | null;
  explanation: string;
  suggestion: string | null;
  code_snippet: string | null;
};
