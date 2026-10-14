import { compareSeverity, pluralize } from "@/lib/format";
import type { ReviewFinding, ReviewStatus } from "@/types/relay";
import { EmptyState } from "./empty-state";
import { FindingCard } from "./finding-card";
import { Count, Panel } from "./panel";

export function FindingsList({
  findings,
  status,
}: {
  findings: ReviewFinding[];
  status: ReviewStatus;
}) {
  const completed =
    status === "clean" || status === "reviewed" || status === "needs_attention";

  const sortedFindings = [...findings].sort((a, b) =>
    compareSeverity(a.severity, b.severity),
  );

  return (
    <Panel
      id="findings"
      title={
        <>
          Findings
          {completed && <Count value={findings.length} />}
        </>
      }
      description={
        completed
          ? findings.length > 0
            ? `${pluralize(findings.length, "potential issue")}, most severe first.`
            : "Relay reviewed the changed code."
          : "Issues Relay detects in the changed code."
      }
    >
      {status === "not_reviewed" && (
        <EmptyState
          bare
          title="No review yet"
          description="Run a review to check the changed code for bugs, security issues and maintainability problems."
        />
      )}

      {status === "running" && (
        <EmptyState
          bare
          title="Review in progress"
          description="Relay is analyzing this pull request. Refresh the page in a moment to see the results."
        />
      )}

      {status === "failed" && (
        <EmptyState
          bare
          tone="danger"
          title="Review failed"
          description="Relay couldn't finish reviewing this pull request. Try running the review again."
        />
      )}

      {completed && findings.length === 0 && (
        <EmptyState
          bare
          title="No issues found"
          description="Relay didn't detect any issues in the changed code."
        />
      )}

      {completed && findings.length > 0 && (
        <div className="divide-y divide-line">
          {sortedFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} linkToFile />
          ))}
        </div>
      )}
    </Panel>
  );
}
