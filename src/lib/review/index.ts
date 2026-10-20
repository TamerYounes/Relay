import { runAiReview } from "./ai";
import { runRules } from "./rules";
import type { ChangedFile, Finding } from "./types";

export type { ChangedFile, Finding } from "./types";

/**
 * Drops findings that point at the same file, line and title. Rule findings
 * come first in the list, so they win over an AI finding for the same issue.
 */
export function removeDuplicateFindings(findings: Finding[]) {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = [
      finding.file_path,
      finding.line,
      finding.title.toLowerCase(),
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/** Runs both review passes over a pull request's changed files. */
export async function reviewPullRequest(
  files: ChangedFile[],
  options: { ollamaUrl: string | null; fetchImpl?: typeof fetch },
) {
  const ruleFindings = files.flatMap(runRules);
  const aiFindings = options.ollamaUrl
    ? await runAiReview(files, options.ollamaUrl, options.fetchImpl)
    : [];

  return {
    findings: removeDuplicateFindings([...ruleFindings, ...aiFindings]),
    ruleFindingsCount: ruleFindings.length,
    aiFindingsCount: aiFindings.length,
  };
}
