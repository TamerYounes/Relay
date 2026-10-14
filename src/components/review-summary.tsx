import { formatSeverity, pluralize, severityOrder } from "@/lib/format";
import type { ReviewFinding, ReviewStatus } from "@/types/relay";
import { RelativeTime } from "./relative-time";
import { severityStyles } from "./severity-badge";
import { StatusBadge } from "./status-badge";

export function ReviewSummary({
  status,
  findings,
  completedAt,
  commitSha,
  headSha,
}: {
  status: ReviewStatus;
  findings: Pick<ReviewFinding, "severity">[];
  completedAt?: string | null;
  commitSha?: string | null;
  /** Current head of the pull request, to tell whether the review is stale. */
  headSha?: string | null;
}) {
  const completed =
    status === "clean" || status === "reviewed" || status === "needs_attention";
  const stale = Boolean(commitSha && headSha && commitSha !== headSha);

  const counts = severityOrder.map((severity) => ({
    severity,
    count: findings.filter((finding) => finding.severity === severity).length,
  }));

  return (
    <section className="surface px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-semibold text-ink">Review</h2>
        <StatusBadge status={status} />
      </div>

      {completed ? (
        <>
          <p className="mt-1.5 text-[13.5px] leading-5 text-ink-muted">
            {pluralize(findings.length, "finding")}
            {commitSha && (
              <>
                {" "}on{" "}
                <span className="font-mono text-xs text-ink">
                  {commitSha.slice(0, 7)}
                </span>
              </>
            )}
            {completedAt && (
              <>
                , <RelativeTime value={completedAt} />
              </>
            )}
            .
            {stale && " New commits were pushed since."}
          </p>

          {findings.length > 0 && (
            <div aria-hidden="true" className="mt-3.5 flex h-1 gap-px overflow-hidden rounded-sm">
              {counts
                .filter(({ count }) => count > 0)
                .map(({ severity, count }) => (
                  <span
                    key={severity}
                    className={severityStyles[severity].bar}
                    style={{ flexGrow: count }}
                  />
                ))}
            </div>
          )}

          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1.5 text-[13.5px]">
            {counts.map(({ severity, count }) => (
              <div key={severity} className="contents">
                <dt className="text-ink-soft">{formatSeverity(severity)}</dt>
                <dd
                  className={`text-right font-semibold tabular-nums ${
                    count > 0 ? severityStyles[severity].text : "font-normal text-ink-faint"
                  }`}
                >
                  {count}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="mt-1.5 text-[13.5px] leading-5 text-ink-muted">
          {status === "running"
            ? "A review is running."
            : status === "failed"
              ? "The last review didn't finish. Run it again."
              : "This pull request hasn't been reviewed yet."}
        </p>
      )}
    </section>
  );
}
