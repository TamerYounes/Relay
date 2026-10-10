import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { buttonStyles } from "@/components/button-styles";
import { DashboardHeader } from "@/components/dashboard-header";
import { EmptyState } from "@/components/empty-state";
import { MetricCard } from "@/components/metric-card";
import { PullRequestList } from "@/components/pr-list";
import { ReviewActivity } from "@/components/review-activity";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/github/encryption";
import { getHighestSeverity, getReviewStatus, pluralize } from "@/lib/format";
import { getReviewStats, type PullRequestHistory } from "@/lib/stats";
import type {
  GitHubPullRequest,
  PullRequestReview,
  Severity,
} from "@/types/relay";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, selected_repository_id")
    .eq("created_by", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!workspace) {
    return (
      <AppShell>
        <main className="space-y-6">
          <DashboardHeader />

          <EmptyState
            title="No workspace found"
            description="Relay couldn't find a workspace for your account. Open Settings to check your workspace."
            action={
              <Link href="/settings" className={buttonStyles.primary}>
                Open settings
              </Link>
            }
          />
        </main>
      </AppShell>
    );
  }

  if (!workspace.selected_repository_id) {
    return (
      <AppShell>
        <main className="space-y-6">
          <DashboardHeader />

          <EmptyState
            title="No repository selected"
            description="Choose a GitHub repository to start reviewing its pull requests."
            action={
              <Link href="/settings" className={buttonStyles.primary}>
                Choose repository
              </Link>
            }
          />
        </main>
      </AppShell>
    );
  }

  const { data: repository } = await supabase
    .from("repositories")
    .select("id, owner, name, full_name, default_branch")
    .eq("id", workspace.selected_repository_id)
    .maybeSingle();

  if (!repository) {
    return (
      <AppShell>
        <main className="space-y-6">
          <DashboardHeader />

          <EmptyState
            title="Repository not found"
            description="The selected repository is no longer available. Choose a different repository in Settings."
            action={
              <Link href="/settings" className={buttonStyles.primary}>
                Choose repository
              </Link>
            }
          />
        </main>
      </AppShell>
    );
  }

  const { data: connection } = await supabase
    .from("github_connections")
    .select("access_token_encrypted")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!connection) {
    return (
      <AppShell>
        <main className="space-y-6">
          <DashboardHeader />

          <EmptyState
            title="GitHub is not connected"
            description="Connect your GitHub account to load pull requests for this repository."
            action={
              <Link href="/settings" className={buttonStyles.primary}>
                Connect GitHub
              </Link>
            }
          />
        </main>
      </AppShell>
    );
  }

  let pullRequests: GitHubPullRequest[] = [];
  let githubStatus: number | null = null;

  try {
    const token = decryptToken(connection.access_token_encrypted);

    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(
        repository.owner,
      )}/${encodeURIComponent(
        repository.name,
      )}/pulls?state=open&sort=updated&direction=desc&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Relay",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      githubStatus = response.status;
      const errorBody = await response.text();

      throw new Error(
        `GitHub API ${response.status} ${response.statusText}: ${errorBody}`,
      );
    }

    pullRequests = await response.json();
  } catch (error) {
    console.error(
      "Failed to load GitHub pull requests:",
      error instanceof Error ? error.message : String(error),
    );

    // GitHub returns 401 "Bad credentials" when the stored OAuth token has
    // been revoked. Reconnecting stores a fresh token.
    if (githubStatus === 401) {
      return (
        <AppShell>
          <main className="space-y-6">
            <DashboardHeader repository={repository} />

            <EmptyState
              tone="danger"
              title="Your GitHub connection is no longer valid"
              description="GitHub rejected the saved access token. It may have been revoked or the Relay authorization removed. Reconnect GitHub to continue."
              action={
                <>
                  <a href="/auth/github" className={buttonStyles.primary}>
                    Reconnect GitHub
                  </a>
                  <Link href="/settings" className={buttonStyles.secondary}>
                    Open settings
                  </Link>
                </>
              }
            />
          </main>
        </AppShell>
      );
    }

    return (
      <AppShell>
        <main className="space-y-6">
          <DashboardHeader repository={repository} />

          <EmptyState
            tone="danger"
            title="Couldn't load pull requests from GitHub"
            description={
              <>
                <p>Check that your GitHub connection is still active.</p>
                {error instanceof Error && (
                  <p className="mt-2 wrap-break-word font-mono text-[11px] text-red-600">
                    {error.message}
                  </p>
                )}
              </>
            }
            action={
              <>
                <Link href="/" className={buttonStyles.secondary}>
                  Try again
                </Link>
                <Link href="/settings" className={buttonStyles.secondary}>
                  Open settings
                </Link>
              </>
            }
          />
        </main>
      </AppShell>
    );
  }

  const [reviews, stats] = await Promise.all([
    getReviewsByPullRequest(
      supabase,
      repository.id,
      new Set(pullRequests.map((pullRequest) => pullRequest.number)),
    ),
    getRepositoryStats(supabase, repository.id),
  ]);

  const openReviews = [...reviews.values()];
  const reviewedCount = openReviews.filter(
    (review) =>
      review.status !== "not_reviewed" &&
      review.status !== "running" &&
      review.status !== "failed",
  ).length;
  const attentionCount = openReviews.filter(
    (review) => review.status === "needs_attention",
  ).length;
  const securityCount = openReviews.reduce(
    (total, review) => total + review.securityFindingsCount,
    0,
  );

  return (
    <AppShell>
      <main className="space-y-6">
        <DashboardHeader repository={repository} />

        <section
          aria-label="Review metrics"
          className="grid grid-cols-2 gap-px overflow-hidden rounded border border-zinc-200 bg-zinc-200 lg:grid-cols-4"
        >
          <MetricCard
            label="Open PRs"
            value={String(pullRequests.length)}
            detail={`In ${repository.full_name}`}
          />

          <MetricCard
            label="Reviewed"
            value={String(reviewedCount)}
            meter={{ value: reviewedCount, max: pullRequests.length }}
            detail={
              pullRequests.length > 0
                ? `${pullRequests.length - reviewedCount} awaiting review`
                : "No open pull requests"
            }
          />

          <MetricCard
            label="Needs attention"
            value={String(attentionCount)}
            detail="High or critical findings"
            tone={attentionCount > 0 ? "warning" : "neutral"}
          />

          <MetricCard
            label="Security findings"
            value={String(securityCount)}
            detail={`Across ${pluralize(reviewedCount, "reviewed PR")}`}
            tone={securityCount > 0 ? "danger" : "neutral"}
          />
        </section>

        <ReviewActivity stats={stats} />

        <PullRequestList pullRequests={pullRequests} reviews={reviews} />
      </main>
    </AppShell>
  );
}

async function getRepositoryStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  repositoryId: string,
) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("pull_requests")
    .select("state, draft, opened_at, first_review_at, merged_at")
    .eq("repository_id", repositoryId)
    .or(`state.eq.open,opened_at.gte.${since},merged_at.gte.${since}`);

  if (error) {
    console.error("Failed to load pull request history:", error.message);
    return null;
  }

  return data.length > 0 ? getReviewStats(data as PullRequestHistory[]) : null;
}

type ReviewWithSecurity = PullRequestReview & {
  securityFindingsCount: number;
};

/**
 * Loads Relay review state for the given open pull requests. Failures are
 * non-fatal: the list still renders, just without review information.
 */
async function getReviewsByPullRequest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  repositoryId: string,
  pullRequestNumbers: Set<number>,
) {
  const reviewsByNumber = new Map<number, ReviewWithSecurity>();

  if (pullRequestNumbers.size === 0) {
    return reviewsByNumber;
  }

  const { data: reviewRows, error: reviewsError } = await supabase
    .from("reviews")
    .select("id, status, github_pr_number")
    .eq("repository_id", repositoryId)
    .in("github_pr_number", [...pullRequestNumbers]);

  if (reviewsError || !reviewRows || reviewRows.length === 0) {
    return reviewsByNumber;
  }

  const { data: findingRows } = await supabase
    .from("review_findings")
    .select("review_id, severity, category")
    .in(
      "review_id",
      reviewRows.map((review) => review.id),
    );

  for (const review of reviewRows) {
    const findings = (findingRows ?? []).filter(
      (finding) => finding.review_id === review.id,
    ) as { severity: Severity; category: string | null }[];
    const completed = review.status === "completed";

    reviewsByNumber.set(review.github_pr_number, {
      status: getReviewStatus(review.status, findings),
      findingsCount: completed ? findings.length : 0,
      highestSeverity: completed ? getHighestSeverity(findings) : null,
      securityFindingsCount: completed
        ? findings.filter(
            (finding) => finding.category?.toLowerCase() === "security",
          ).length
        : 0,
    });
  }

  return reviewsByNumber;
}
