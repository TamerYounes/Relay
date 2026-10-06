import { formatSeverity, severityOrder } from "@/lib/format";
import type { ReviewFinding, ReviewStatus } from "@/types/relay";
import { RelativeTime } from "./relative-time";
import { severityStyles } from "./severity-badge";
import { StatusBadge } from "./status-badge";

export function ReviewSummary({
  status,
  findings,
  completedAt,
  commitSha,
}: {
  status: ReviewStatus;
  findings: Pick<ReviewFinding, "severity">[];
  completedAt?: string | null;
  commitSha?: string | null;
}) {
  const completed =
    status === "clean" || status === "reviewed" || status === "needs_attention";

  const counts = severityOrder.map((severity) => ({
    severity,
    count: findings.filter((finding) => finding.severity === severity).length,
  }));

  return (
    <section className="overflow-hidden rounded border border-zinc-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
        <h2 className="eyebrow text-zinc-500">Review</h2>
        <StatusBadge status={status} />
      </div>

      {completed ? (
        <>
          <div className="px-4 pb-1 pt-4">
            <p className="font-mono text-[28px] font-medium leading-none tabular-nums text-zinc-950">
              {findings.length}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {findings.length === 1 ? "finding" : "findings"}
            </p>

            {findings.length > 0 && (
              <div aria-hidden="true" className="mt-3 flex h-1.5 gap-px overflow-hidden">
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
          </div>

          <dl className="mt-2 border-t border-zinc-100">
            {counts.map(({ severity, count }) => (
              <div
                key={severity}
                className="flex items-center justify-between px-4 py-1.5"
              >
                <dt className="flex items-center gap-2 text-[13px] text-zinc-600">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 ${severityStyles[severity].bar}`}
                  />
                  {formatSeverity(severity)}
                </dt>
                <dd
                  className={`font-mono text-[13px] font-medium tabular-nums ${
                    count > 0 ? severityStyles[severity].text : "text-zinc-300"
                  }`}
                >
                  {count}
                </dd>
              </div>
            ))}
          </dl>

          {(completedAt || commitSha) && (
            <div className="mt-1 space-y-0.5 border-t border-zinc-200 bg-zinc-50 px-4 py-2.5 font-mono text-[11px] text-zinc-500">
              {completedAt && (
                <p>
                  reviewed <RelativeTime value={completedAt} />
                </p>
              )}
              {commitSha && (
                <p>
                  at <span className="text-zinc-800">{commitSha.slice(0, 7)}</span>
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="px-4 py-3.5 text-[13px] leading-5 text-zinc-600">
          {status === "running"
            ? "A review is currently running."
            : status === "failed"
              ? "The last review didn't complete."
              : "This pull request hasn't been reviewed by Relay yet."}
        </p>
      )}
    </section>
  );
}
