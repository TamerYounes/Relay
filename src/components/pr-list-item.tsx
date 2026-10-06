import Link from "next/link";
import { pluralize } from "@/lib/format";
import type { GitHubPullRequest, PullRequestReview } from "@/types/relay";
import { PullRequestIcon } from "./pull-request-icon";
import { RelativeTime } from "./relative-time";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";

export function PullRequestListItem({
  pullRequest,
  review,
}: {
  pullRequest: GitHubPullRequest;
  review: PullRequestReview;
}) {
  const author = pullRequest.user?.login ?? "unknown";

  return (
    <li>
      <Link
        href={`/pull-requests/${pullRequest.number}`}
        className="group grid gap-x-6 gap-y-2.5 px-4 py-3.5 transition-colors hover:row-cursor hover:bg-zinc-50 focus-visible:row-cursor focus-visible:bg-zinc-50 focus-visible:outline-none sm:px-5 md:grid-cols-[minmax(0,1fr)_200px_88px] md:items-center"
      >
        <div className="flex min-w-0 gap-3">
          <PullRequestIcon
            draft={pullRequest.draft}
            className="mt-0.5 h-4 w-4 shrink-0"
          />

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-[14px] font-semibold leading-5 text-zinc-950 underline-offset-2 group-hover:underline">
                {pullRequest.title}
              </h3>

              {pullRequest.draft && (
                <span className="eyebrow shrink-0 rounded-xs border border-zinc-300 px-1 leading-4 text-zinc-500">
                  Draft
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
              <span className="font-mono text-zinc-400">
                #{pullRequest.number}
              </span>

              <span className="inline-flex items-center gap-1.5">
                {pullRequest.user?.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pullRequest.user.avatar_url}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 rounded-xs"
                  />
                )}
                <span className="font-medium text-zinc-700">{author}</span>
              </span>

              <span>
                opened <RelativeTime value={pullRequest.created_at} />
              </span>

              {pullRequest.head?.ref && pullRequest.base?.ref && (
                <span className="hidden min-w-0 items-center gap-1 font-mono text-[11px] text-zinc-500 sm:inline-flex">
                  <span className="max-w-64 truncate">{pullRequest.head.ref}</span>
                  <span aria-hidden="true" className="text-zinc-300">
                    →
                  </span>
                  <span className="max-w-40 truncate">{pullRequest.base.ref}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pl-7 md:pl-0">
          <StatusBadge status={review.status} />

          {review.highestSeverity && (
            <SeverityBadge severity={review.highestSeverity} />
          )}

          {review.findingsCount > 0 && (
            <span className="font-mono text-[11px] tabular-nums text-zinc-500 md:hidden">
              {pluralize(review.findingsCount, "finding")}
            </span>
          )}
        </div>

        <div className="hidden text-right md:block">
          <RelativeTime
            value={pullRequest.updated_at}
            className="font-mono text-[11.5px] text-zinc-600"
          />
          {review.findingsCount > 0 && (
            <p className="mt-0.5 font-mono text-[11px] tabular-nums text-zinc-400">
              {pluralize(review.findingsCount, "finding")}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
