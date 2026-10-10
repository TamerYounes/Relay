import type { AdminClient } from "@/lib/supabase/admin";
import { githubFetch } from "./api";

export type GitHubPullRequestPayload = {
  number: number;
  title: string;
  state: "open" | "closed";
  draft?: boolean;
  user?: { login: string } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
};

export type GitHubReviewPayload = {
  state: string;
  submitted_at?: string | null;
  user?: { login: string } | null;
};

export type PullRequestRow = {
  repository_id: string;
  number: number;
  title: string;
  author_login: string | null;
  state: "open" | "closed" | "merged";
  draft: boolean;
  opened_at: string;
  closed_at: string | null;
  merged_at: string | null;
  github_updated_at: string;
  first_review_at?: string | null;
};

export function toPullRequestRow(
  repositoryId: string,
  pullRequest: GitHubPullRequestPayload,
): PullRequestRow {
  return {
    repository_id: repositoryId,
    number: pullRequest.number,
    title: pullRequest.title,
    author_login: pullRequest.user?.login ?? null,
    state: pullRequest.merged_at ? "merged" : pullRequest.state,
    draft: pullRequest.draft ?? false,
    opened_at: pullRequest.created_at,
    closed_at: pullRequest.closed_at,
    merged_at: pullRequest.merged_at,
    github_updated_at: pullRequest.updated_at,
  };
}

// A review counts once it's submitted by someone other than the author.
export function isCountedReview(
  review: GitHubReviewPayload,
  authorLogin: string | null,
) {
  return (
    Boolean(review.submitted_at) &&
    review.state.toUpperCase() !== "PENDING" &&
    review.user?.login !== authorLogin
  );
}

export function getFirstReviewAt(
  reviews: GitHubReviewPayload[],
  authorLogin: string | null,
): string | null {
  const times = reviews
    .filter((review) => isCountedReview(review, authorLogin))
    .map((review) => review.submitted_at as string)
    .sort();

  return times[0] ?? null;
}

export function earlierDate(a: string | null | undefined, b: string) {
  if (!a) return b;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
) {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );

  return results;
}

export async function syncRecentPullRequests(
  admin: AdminClient,
  token: string,
  repository: { id: string; owner: string; name: string },
) {
  const repoPath = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;

  const pullRequests = await githubFetch<GitHubPullRequestPayload[]>(
    token,
    `${repoPath}/pulls?state=all&sort=updated&direction=desc&per_page=50`,
  );

  const rows = await mapWithLimit(pullRequests, 5, async (pullRequest) => {
    const reviews = await githubFetch<GitHubReviewPayload[]>(
      token,
      `${repoPath}/pulls/${pullRequest.number}/reviews?per_page=100`,
    );

    return {
      ...toPullRequestRow(repository.id, pullRequest),
      first_review_at: getFirstReviewAt(
        reviews,
        pullRequest.user?.login ?? null,
      ),
    };
  });

  if (rows.length === 0) {
    return 0;
  }

  const { error } = await admin
    .from("pull_requests")
    .upsert(rows, { onConflict: "repository_id,number" });

  if (error) {
    throw error;
  }

  return rows.length;
}

export async function findRepositoryIds(
  admin: AdminClient,
  githubRepository: { id: number; full_name: string },
) {
  const { data: byId, error } = await admin
    .from("repositories")
    .select("id")
    .eq("github_repo_id", githubRepository.id);

  if (error) {
    throw error;
  }

  if (byId.length > 0) {
    return byId.map((row) => row.id as string);
  }

  const { data: byName, error: nameError } = await admin
    .from("repositories")
    .select("id")
    .ilike("full_name", githubRepository.full_name);

  if (nameError) {
    throw nameError;
  }

  return byName.map((row) => row.id as string);
}

export async function savePullRequest(
  admin: AdminClient,
  repositoryIds: string[],
  pullRequest: GitHubPullRequestPayload,
) {
  if (repositoryIds.length === 0) return;

  const { error } = await admin.from("pull_requests").upsert(
    repositoryIds.map((id) => toPullRequestRow(id, pullRequest)),
    { onConflict: "repository_id,number" },
  );

  if (error) {
    throw error;
  }
}

export async function saveReview(
  admin: AdminClient,
  repositoryIds: string[],
  pullRequest: GitHubPullRequestPayload,
  review: GitHubReviewPayload,
) {
  const authorLogin = pullRequest.user?.login ?? null;

  if (repositoryIds.length === 0 || !isCountedReview(review, authorLogin)) {
    return;
  }

  const submittedAt = review.submitted_at as string;

  const { data: existing, error } = await admin
    .from("pull_requests")
    .select("repository_id, first_review_at")
    .eq("number", pullRequest.number)
    .in("repository_id", repositoryIds);

  if (error) {
    throw error;
  }

  const rows = repositoryIds.map((id) => {
    const current = existing.find((row) => row.repository_id === id);

    return {
      ...toPullRequestRow(id, pullRequest),
      first_review_at: earlierDate(current?.first_review_at, submittedAt),
    };
  });

  const { error: upsertError } = await admin
    .from("pull_requests")
    .upsert(rows, { onConflict: "repository_id,number" });

  if (upsertError) {
    throw upsertError;
  }
}
