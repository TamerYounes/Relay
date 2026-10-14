import Link from "next/link";
import type { ReactNode } from "react";
import { cache } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { buttonStyles } from "@/components/button-styles";
import { ChangedFilesPanel } from "@/components/changed-files-panel";
import { FindingsList } from "@/components/findings-list";
import { Avatar } from "@/components/avatar";
import { ExternalIcon } from "@/components/icons";
import { Panel } from "@/components/panel";
import { RelativeTime } from "@/components/relative-time";
import { ReviewSummary } from "@/components/review-summary";
import { RunReviewButton } from "@/components/run-review-button";
import { getReviewStatus, pluralize } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/github/encryption";
import { fetchAllPages, githubHeaders } from "@/lib/github/api";

type GitHubPullRequest = {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  draft: boolean;
  user?: {
    login: string;
    avatar_url: string;
  };
  head?: {
    ref: string;
    sha: string;
  };
  base?: {
    ref: string;
    sha: string;
  };
  created_at: string;
  updated_at: string;
  additions: number;
  deletions: number;
  changed_files: number;
};

type GitHubFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

type ReviewFinding = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  title: string;
  file_path: string;
  line: number | null;
  explanation: string;
  suggestion: string | null;
  code_snippet: string | null;
};

async function getRepositoryAndToken() {
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

  if (!workspace || !workspace.selected_repository_id) {
    return null;
  }

  const { data: repository } = await supabase
    .from("repositories")
    .select("id, owner, name, full_name")
    .eq("id", workspace.selected_repository_id)
    .maybeSingle();

  const { data: connection } = await supabase
    .from("github_connections")
    .select("access_token_encrypted")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!repository || !connection) {
    return null;
  }

  try {
    return {
      supabase,
      repository,
      token: decryptToken(connection.access_token_encrypted),
    };
  } catch {
    return null;
  }
}

// Cached per request so generateMetadata and the page share one set of
// GitHub calls.
const getPullRequest = cache(async (id: string) => {
  const connection = await getRepositoryAndToken();

  if (!connection) {
    return null;
  }

  const { supabase, repository, token } = connection;

  const headers = githubHeaders(token);

  const repositoryPath = `${encodeURIComponent(
    repository.owner,
  )}/${encodeURIComponent(repository.name)}`;

  const pullRequestResponse = await fetch(
    `https://api.github.com/repos/${repositoryPath}/pulls/${encodeURIComponent(
      id,
    )}`,
    {
      headers,
      cache: "no-store",
    },
  );

  if (!pullRequestResponse.ok) {
    return null;
  }

  const pullRequest: GitHubPullRequest =
    await pullRequestResponse.json();

  // GitHub lists at most 3,000 files per pull request, 100 per page.
  const files = await fetchAllPages<GitHubFile>(
    `https://api.github.com/repos/${repositoryPath}/pulls/${encodeURIComponent(
      id,
    )}/files?per_page=100`,
    token,
    30,
  ).catch(() => [] as GitHubFile[]);

  const { data: review } = await supabase
    .from("reviews")
    .select("id, status, completed_at, commit_sha")
    .eq("repository_id", repository.id)
    .eq("github_pr_number", pullRequest.number)
    .maybeSingle();

  let findings: ReviewFinding[] = [];

  if (review) {
    const { data } = await supabase
      .from("review_findings")
      .select(
        "id, severity, category, title, file_path, line, explanation, suggestion, code_snippet",
      )
      .eq("review_id", review.id)
      .order("created_at", { ascending: true });

    findings = data ?? [];
  }

  return {
    pullRequest,
    files,
    review,
    findings,
  };
});

export async function generateMetadata(
  props: PageProps<"/pull-requests/[id]">,
) {
  const { id } = await props.params;
  const result = await getPullRequest(id);

  if (!result) {
    return {
      title: "Pull request not found | Relay",
    };
  }

  return {
    title: `#${result.pullRequest.number} ${result.pullRequest.title} | Relay`,
    description:
      result.pullRequest.body ?? "Pull request review in Relay.",
  };
}

export default async function PullRequestDetailPage(
  props: PageProps<"/pull-requests/[id]">,
) {
  const { id } = await props.params;
  const result = await getPullRequest(id);

  if (!result) {
    notFound();
  }

  const {
    pullRequest,
    files,
    review,
    findings,
  } = result;

  const reviewStatus = getReviewStatus(review?.status, findings);

  const findingsByFile = new Map<string, number>();
  for (const finding of findings) {
    findingsByFile.set(
      finding.file_path,
      (findingsByFile.get(finding.file_path) ?? 0) + 1,
    );
  }

  return (
    <AppShell>
      <main className="space-y-7">
        <nav aria-label="Breadcrumb" className="text-[13px] text-ink-muted">
          <Link href="/" className="transition-colors hover:text-ink">
            Pull requests
          </Link>
        </nav>

        <header>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <h1 className="wrap-break-word text-[26px] font-bold leading-tight tracking-[-0.03em] text-ink sm:text-[30px]">
                {pullRequest.title}{" "}
                <span className="font-normal text-ink-faint">
                  #{pullRequest.number}
                </span>
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[14px] text-ink-muted">
                <span
                  className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold ${
                    pullRequest.draft
                      ? "bg-surface-3 text-ink-soft"
                      : "bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30"
                  }`}
                >
                  {pullRequest.draft ? "Draft" : "Open"}
                </span>

                <span className="inline-flex items-center gap-2">
                  <Avatar
                    name={pullRequest.user?.login ?? "?"}
                    src={pullRequest.user?.avatar_url}
                    size={22}
                  />
                  <span>
                    <span className="font-semibold text-ink">
                      {pullRequest.user?.login ?? "Unknown"}
                    </span>{" "}
                    wants to merge
                  </span>
                </span>
                <BranchName>{pullRequest.head?.ref}</BranchName>
                <span>into</span>
                <BranchName>{pullRequest.base?.ref}</BranchName>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <a
                href={pullRequest.html_url}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles.secondary}
              >
                Open on GitHub
                <ExternalIcon className="h-3.5 w-3.5 text-ink-faint" />
              </a>

              <RunReviewButton
                prNumber={pullRequest.number}
                upToDate={
                  review?.status === "completed" &&
                  review.commit_sha === pullRequest.head?.sha
                }
                hasReview={review?.status === "completed"}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-8">
            {pullRequest.body && (
              <Panel title="Description">
                <p className="max-h-80 overflow-y-auto whitespace-pre-wrap wrap-break-word px-4 py-3.5 text-[14px] leading-6 text-ink-soft sm:px-5">
                  {pullRequest.body}
                </p>
              </Panel>
            )}

            <FindingsList findings={findings} status={reviewStatus} />

            <ChangedFilesPanel files={files} findingsByFile={findingsByFile} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <ReviewSummary
              status={reviewStatus}
              findings={findings}
              completedAt={review?.completed_at}
              commitSha={review?.commit_sha}
              headSha={pullRequest.head?.sha}
            />

            <section className="surface px-5 py-4">
              <h2 className="text-[14px] font-semibold text-ink">
                Details
              </h2>

              <dl className="mt-2 space-y-2 text-[13.5px]">
                <DetailRow label="Author">
                  {pullRequest.user?.login ?? "Unknown"}
                </DetailRow>
                <DetailRow label="Opened">
                  <RelativeTime value={pullRequest.created_at} />
                </DetailRow>
                <DetailRow label="Updated">
                  <RelativeTime value={pullRequest.updated_at} />
                </DetailRow>
                <DetailRow label="Files">
                  {pluralize(pullRequest.changed_files, "file")}
                </DetailRow>
                <DetailRow label="Changes">
                  <span className="tabular-nums">
                    <span className="text-emerald-400">
                      +{pullRequest.additions}
                    </span>{" "}
                    <span className="text-red-400">
                      −{pullRequest.deletions}
                    </span>
                  </span>
                </DetailRow>
              </dl>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-ink">
        {children}
      </dd>
    </div>
  );
}

function BranchName({ children }: { children: ReactNode }) {
  return (
    <span className="max-w-56 truncate rounded-md bg-surface px-2 py-0.5 font-mono text-[12.5px] text-ink shadow-(--shadow-card)">
      {children}
    </span>
  );
}
