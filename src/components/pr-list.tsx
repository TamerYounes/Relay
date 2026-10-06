import { getReviewStatus } from "@/lib/format";
import type { GitHubPullRequest, PullRequestReview } from "@/types/relay";
import { EmptyState } from "./empty-state";
import { PullRequestListItem } from "./pr-list-item";

const notReviewed: PullRequestReview = {
  status: getReviewStatus(null, []),
  findingsCount: 0,
  highestSeverity: null,
};

export function PullRequestList({
  pullRequests,
  reviews,
}: {
  pullRequests: GitHubPullRequest[];
  /** Review state keyed by pull request number. */
  reviews: Map<number, PullRequestReview>;
}) {
  const drafts = pullRequests.filter((pullRequest) => pullRequest.draft).length;

  return (
    <section
      aria-label="Pull requests"
      className="overflow-hidden rounded border border-zinc-200 bg-white"
    >
      <div className="grid items-center gap-x-6 border-b border-zinc-200 bg-zinc-50 px-4 py-2 sm:px-5 md:grid-cols-[minmax(0,1fr)_200px_88px]">
        <p className="eyebrow text-zinc-500">
          Open <span className="tabular-nums text-zinc-900">{pullRequests.length}</span>
          {drafts > 0 && (
            <>
              <span className="mx-1.5 text-zinc-300">/</span>
              Draft <span className="tabular-nums text-zinc-900">{drafts}</span>
            </>
          )}
        </p>

        <span className="eyebrow hidden text-zinc-500 md:block">Review</span>
        <span className="eyebrow hidden text-right text-zinc-500 md:block">Updated</span>
      </div>

      {pullRequests.length === 0 ? (
        <EmptyState
          bare
          title="No open pull requests"
          description="When pull requests are opened in this repository, they'll show up here."
        />
      ) : (
        <ul className="divide-y divide-zinc-100">
          {pullRequests.map((pullRequest) => (
            <PullRequestListItem
              key={pullRequest.id}
              pullRequest={pullRequest}
              review={reviews.get(pullRequest.number) ?? notReviewed}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
