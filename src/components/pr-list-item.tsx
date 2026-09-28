import Link from "next/link";
import { formatReviewedAt } from "@/lib/format";
import type { PullRequest } from "@/types/relay";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";

export function PullRequestListItem({
  pullRequest,
}: {
  pullRequest: PullRequest;
}) {
  const findingCount = pullRequest.findings.length;

  const filesWithFindings = pullRequest.files.filter(
    (file) => file.findings > 0,
  ).length;

  return (
    <li>
      <Link
        href={`/pull-requests/${pullRequest.id}`}
        className="group block px-5 py-5 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-inset"
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-zinc-400">
                #{pullRequest.number}
              </span>

              <StatusBadge status={pullRequest.status} />
              <SeverityBadge severity={pullRequest.severity} />
            </div>

            <h3 className="mt-2 truncate text-sm font-semibold text-zinc-950 group-hover:text-zinc-600">
              {pullRequest.title}
            </h3>

            <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
              {pullRequest.summary}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="font-mono text-zinc-500">
                {pullRequest.repository}
              </span>

              <span className="text-zinc-300">·</span>

              <span className="text-zinc-400">{pullRequest.author}</span>

              <span className="text-zinc-300">·</span>

              <span className="text-zinc-400">
                {formatReviewedAt(pullRequest.reviewedAt)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4 md:border-t-0 md:pt-0">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Findings
              </p>

              <p
                className={`mt-1 font-mono text-sm font-semibold ${
                  findingCount > 0 ? "text-zinc-950" : "text-zinc-400"
                }`}
              >
                {findingCount}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Files
              </p>

              <p className="mt-1 font-mono text-sm font-semibold text-zinc-900">
                {filesWithFindings}/{pullRequest.files.length}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Review
              </p>

              <p className="mt-1 font-mono text-sm font-semibold text-zinc-900">
                {pullRequest.reviewDuration}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}