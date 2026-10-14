import { getReviewStatus } from "@/lib/format";
import type {
  GitHubPullRequest,
  PullRequestReview,
  ReviewStatus,
} from "@/types/relay";
import { EmptyState } from "./empty-state";
import { PullRequestListItem } from "./pr-list-item";

const notReviewed: PullRequestReview = {
  status: getReviewStatus(null, []),
  findingsCount: 0,
  highestSeverity: null,
};

/** Pull requests grouped by what a person needs to do with them. */
export const triageGroups: {
  id: string;
  title: string;
  statuses: ReviewStatus[];
  attention?: boolean;
}[] = [
  {
    id: "needs-you",
    title: "Needs you",
    statuses: ["needs_attention", "failed"],
    attention: true,
  },
  {
    id: "waiting",
    title: "Waiting for review",
    statuses: ["not_reviewed", "running"],
  },
  {
    id: "reviewed",
    title: "Reviewed",
    statuses: ["reviewed", "clean"],
  },
];

export function getReview(
  reviews: Map<number, PullRequestReview>,
  pullRequestNumber: number,
) {
  return reviews.get(pullRequestNumber) ?? notReviewed;
}

export function PullRequestList({
  pullRequests,
  reviews,
}: {
  pullRequests: GitHubPullRequest[];
  /** Review state keyed by pull request number. */
  reviews: Map<number, PullRequestReview>;
}) {
  if (pullRequests.length === 0) {
    return (
      <EmptyState
        title="No open pull requests"
        description="When pull requests are opened in this repository, they'll show up here."
      />
    );
  }

  const items = pullRequests.map((pullRequest) => ({
    pullRequest,
    review: getReview(reviews, pullRequest.number),
  }));

  return (
    <div className="space-y-9">
      {triageGroups.map((group) => {
        const groupItems = items.filter((item) =>
          group.statuses.includes(item.review.status),
        );

        if (groupItems.length === 0) {
          return null;
        }

        return (
          <section
            key={group.id}
            id={group.id}
            aria-label={group.title}
            className="scroll-mt-6 space-y-2.5"
          >
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-semibold text-ink">
                {group.title}
              </h2>
              <span
                className={`text-[14px] tabular-nums ${
                  group.attention ? "font-semibold text-accent" : "text-ink-faint"
                }`}
              >
                {groupItems.length}
              </span>
            </div>

            <ul className="surface divide-y divide-line overflow-hidden">
              {groupItems.map(({ pullRequest, review }) => (
                <PullRequestListItem
                  key={pullRequest.id}
                  pullRequest={pullRequest}
                  review={review}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
