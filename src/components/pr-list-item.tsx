import Link from "next/link";
import { pluralize } from "@/lib/format";
import type { GitHubPullRequest, PullRequestReview } from "@/types/relay";
import { Avatar } from "./avatar";
import { BranchIcon, ChevronRightIcon } from "./icons";
import { RelativeTime } from "./relative-time";
import { SeverityBadge } from "./severity-badge";
import { StatusBadge } from "./status-badge";

// Ring around the author's avatar when the pull request is urgent.
const urgentRing: Record<string, string> = {
  critical: "ring-2! ring-red-500! ring-offset-2 ring-offset-surface",
  high: "ring-2! ring-orange-400! ring-offset-2 ring-offset-surface",
  failed: "ring-2! ring-red-400/70! ring-offset-2 ring-offset-surface",
};

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
        className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none sm:px-5"
      >
        <Avatar
          name={author}
          src={pullRequest.user?.avatar_url}
          size={34}
          className={
            urgentRing[
              review.status === "failed" ? "failed" : (review.highestSeverity ?? "")
            ] ?? ""
          }
        />

        <div className="grid min-w-0 flex-1 gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold leading-5 text-ink">
                {pullRequest.title}
              </h3>

              {pullRequest.draft && (
                <span className="shrink-0 rounded-full bg-surface-3 px-2 text-xs font-medium leading-5 text-ink-muted">
                  Draft
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
              <span className="tabular-nums text-ink-muted">#{pullRequest.number}</span>
              <span>
                <span className="text-ink-soft">{author}</span> updated{" "}
                <RelativeTime value={pullRequest.updated_at} />
              </span>
              {pullRequest.head?.ref && (
                <span className="hidden min-w-0 items-center gap-1 sm:inline-flex">
                  <BranchIcon className="h-3.5 w-3.5 text-ink-faint" />
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
                <span className="whitespace-nowrap text-[13px] text-ink-muted">
                  {pluralize(review.findingsCount, "finding")}
                </span>
              </>
            ) : (
              <StatusBadge status={review.status} />
            )}
          </div>
        </div>

        <ChevronRightIcon className="hidden h-4 w-4 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-ink-muted sm:block" />
      </Link>
    </li>
  );
}
