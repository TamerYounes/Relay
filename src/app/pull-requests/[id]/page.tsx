import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { buttonStyles } from "@/components/button-styles";
import { ChangedFilesPanel } from "@/components/changed-files-panel";
import { FindingsList } from "@/components/findings-list";
import { PullRequestIcon } from "@/components/pull-request-icon";
import { RelativeTime } from "@/components/relative-time";
import { ReviewSummary } from "@/components/review-summary";
import { RunReviewButton } from "@/components/run-review-button";
import { getReviewStatus, pluralize } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/github/encryption";

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

async function getPullRequest(id: string) {
  const connection = await getRepositoryAndToken();

  if (!connection) {
    return null;
  }

  const { supabase, repository, token } = connection;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

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

  const filesResponse = await fetch(
    `https://api.github.com/repos/${repositoryPath}/pulls/${encodeURIComponent(
      id,
    )}/files?per_page=100`,
    {
      headers,
      cache: "no-store",
    },
  );

  const files: GitHubFile[] = filesResponse.ok
    ? await filesResponse.json()
    : [];

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
    repository,
    pullRequest,
    files,
    review,
    findings,
  };
}

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
    repository,
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
      <main className="space-y-6">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-1.5 font-mono text-xs text-zinc-500"
        >
          <Link
            href="/"
            className="shrink-0 font-medium transition-colors hover:text-zinc-950"
          >
            Pull requests
          </Link>
          <span aria-hidden="true" className="text-zinc-300">
            /
          </span>
          <span className="truncate font-mono">{repository.full_name}</span>
          <span aria-hidden="true" className="text-zinc-300">
            /
          </span>
          <span className="shrink-0 font-mono text-zinc-700">
            #{pullRequest.number}
          </span>
        </nav>

        <header className="border-b border-zinc-300 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="wrap-break-word text-[22px] font-semibold leading-tight tracking-[-0.02em] text-zinc-950 sm:text-[26px]">
                {pullRequest.title}{" "}
                <span className="font-mono text-[0.8em] font-normal text-zinc-400">
                  #{pullRequest.number}
                </span>
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px] text-zinc-500">
                <span
                  className={`inline-flex h-6 items-center gap-1.5 rounded-xs border px-2 font-mono text-[11px] font-semibold uppercase tracking-wide ${
                    pullRequest.draft
                      ? "border-zinc-300 bg-zinc-100 text-zinc-600"
                      : "border-emerald-700 bg-emerald-700 text-white [&_svg]:text-white"
                  }`}
                >
                  <PullRequestIcon
                    draft={pullRequest.draft}
                    className="h-3.5 w-3.5"
                  />
                  {pullRequest.draft ? "Draft" : "Open"}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  {pullRequest.user?.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pullRequest.user.avatar_url}
                      alt=""
                      width={18}
                      height={18}
                      className="h-4.5 w-4.5 rounded-xs"
                    />
                  )}
                  <span className="font-medium text-zinc-800">
                    {pullRequest.user?.login ?? "Unknown"}
                  </span>
                </span>

                <span>wants to merge into</span>

                <span className="inline-flex min-w-0 items-center gap-1 font-mono text-xs">
                  <span className="max-w-40 truncate rounded-xs border border-zinc-300 bg-white px-1.5 py-0.5 text-zinc-800">
                    {pullRequest.base?.ref}
                  </span>
                  <span aria-hidden="true" className="text-zinc-400">
                    ←
                  </span>
                  <span className="max-w-56 truncate rounded-xs border border-zinc-300 bg-white px-1.5 py-0.5 text-zinc-800">
                    {pullRequest.head?.ref}
                  </span>
                </span>
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
                <span aria-hidden="true" className="text-zinc-400">
                  ↗
                </span>
              </a>

              <RunReviewButton
                prNumber={pullRequest.number}
                hasReview={review?.status === "completed"}
              />
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 space-y-6">
            {pullRequest.body && (
              <section className="overflow-hidden rounded border border-zinc-200 bg-white">
                <h2 className="eyebrow border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-zinc-500 sm:px-5">
                  Description
                </h2>
                <p className="max-h-80 overflow-y-auto whitespace-pre-wrap wrap-break-word px-4 py-3 text-[13px] leading-6 text-zinc-700 sm:px-5">
                  {pullRequest.body}
                </p>
              </section>
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
            />

            <section className="overflow-hidden rounded border border-zinc-200 bg-white">
              <h2 className="eyebrow border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-zinc-500">
                Details
              </h2>

              <dl className="divide-y divide-zinc-100 text-[13px]">
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
                  <span className="font-mono text-xs tabular-nums">
                    <span className="text-emerald-600">
                      +{pullRequest.additions}
                    </span>{" "}
                    <span className="text-red-600">
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
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <dt className="text-[13px] text-zinc-500">{label}</dt>
      <dd className="min-w-0 truncate text-right font-mono text-xs text-zinc-800">
        {children}
      </dd>
    </div>
  );
}
