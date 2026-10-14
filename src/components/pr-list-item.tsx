import Link from "next/link";
import { pluralize } from "@/lib/format";
import type { GitHubPullRequest, PullRequestReview } from "@/types/relay";
import { Avatar } from "./avatar";
import { BranchIcon, ChevronRightIcon } from "./icons";
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
        className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-zinc-50/80 focus-visible:bg-zinc-50 focus-visible:outline-none sm:px-5"
      >
        <Avatar name={author} src={pullRequest.user?.avatar_url} size={32} />

        <div className="grid min-w-0 flex-1 gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold leading-5 text-zinc-900">
                {pullRequest.title}
              </h3>

              {pullRequest.draft && (
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 text-xs font-medium leading-5 text-zinc-600">
                  Draft
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-zinc-500">
              <span className="tabular-nums text-zinc-600">#{pullRequest.number}</span>
              <span>
                <span className="text-zinc-700">{author}</span> updated{" "}
                <RelativeTime value={pullRequest.updated_at} />
              </span>
              {pullRequest.head?.ref && (
                <span className="hidden min-w-0 items-center gap-1 sm:inline-flex">
                  <BranchIcon className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="max-w-56 truncate font-mono text-[12px]">
                    {pullRequest.head.ref}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:justify-end">
            {review.highestSeverity ? (
              <>
                <SeverityBadge severity={review.highestSeverity} />
                <span className="whitespace-nowrap text-[13px] text-zinc-500">
                  {pluralize(review.findingsCount, "finding")}
                </span>
              </>
            ) : (
              <StatusBadge status={review.status} />
            )}
          </div>
        </div>

        <ChevronRightIcon className="hidden h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-500 sm:block" />
      </Link>
    </li>
  );
}
