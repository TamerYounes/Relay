import type { PullRequest } from "@/types/relay";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";

export function ReviewSummary({
  pullRequest,
}: {
  pullRequest: PullRequest;
}) {
  const criticalCount = pullRequest.findings.filter(
    (finding) => finding.severity === "critical",
  ).length;

  const highCount = pullRequest.findings.filter(
    (finding) => finding.severity === "high",
  ).length;

  const mediumCount = pullRequest.findings.filter(
    (finding) => finding.severity === "medium",
  ).length;

  const lowCount = pullRequest.findings.filter(
    (finding) => finding.severity === "low",
  ).length;

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Review result
          </p>

          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={pullRequest.status} />
            <SeverityBadge severity={pullRequest.severity} />
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs text-zinc-400">Review duration</p>
          <p className="mt-1 font-mono text-sm font-semibold text-zinc-900">
            {pullRequest.reviewDuration}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-4">
        <div className="border-b border-zinc-200 px-5 py-4 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Critical
          </p>
          <p className="mt-2 font-mono text-xl font-semibold text-red-600">
            {criticalCount}
          </p>
        </div>

        <div className="border-b border-zinc-200 px-5 py-4 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            High
          </p>
          <p className="mt-2 font-mono text-xl font-semibold text-orange-600">
            {highCount}
          </p>
        </div>

        <div className="border-b border-zinc-200 px-5 py-4 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Medium
          </p>
          <p className="mt-2 font-mono text-xl font-semibold text-amber-600">
            {mediumCount}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Low
          </p>
          <p className="mt-2 font-mono text-xl font-semibold text-zinc-600">
            {lowCount}
          </p>
        </div>
      </div>
    </section>
  );
}