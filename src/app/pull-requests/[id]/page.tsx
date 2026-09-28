import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RunReviewButton } from "@/components/run-review-button";
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
    .select("id, status")
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

function severityClasses(severity: ReviewFinding["severity"]) {
  switch (severity) {
    case "critical":
      return "border-red-200 bg-red-50 text-red-700";

    case "high":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "medium":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";

    case "low":
      return "border-zinc-200 bg-zinc-50 text-zinc-600";
  }
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

  return (
    <AppShell>
      <main className="space-y-6">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-950"
          >
            <span aria-hidden="true">←</span>
            Pull requests
          </Link>
        </nav>

        <header className="rounded-lg border border-zinc-200 bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            <span className="font-mono">
              {repository.full_name}
            </span>

            <span aria-hidden="true">/</span>

            <span className="font-mono">
              #{pullRequest.number}
            </span>

            {pullRequest.draft && (
              <>
                <span aria-hidden="true">·</span>

                <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  Draft
                </span>
              </>
            )}
          </div>

          <h1 className="mt-3 max-w-4xl text-2xl font-semibold tracking-tight text-zinc-950">
            {pullRequest.title}
          </h1>

          {pullRequest.body && (
            <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-zinc-500">
              {pullRequest.body}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
            <span>
              Opened by {pullRequest.user?.login ?? "Unknown"}
            </span>

            <span className="hidden text-zinc-300 sm:inline">
              ·
            </span>

            <span className="font-mono">
              {pullRequest.head?.ref} → {pullRequest.base?.ref}
            </span>

            <span className="hidden text-zinc-300 sm:inline">
              ·
            </span>

            <span>
              {pullRequest.additions} additions
            </span>

            <span>
              {pullRequest.deletions} deletions
            </span>

            <span>
              {pullRequest.changed_files} files
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <RunReviewButton
              prNumber={pullRequest.number}
              hasReview={review?.status === "completed"}
            />

            <a
              href={pullRequest.html_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Open on GitHub
            </a>
          </div>
        </header>

        {review?.status === "completed" && (
          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Review findings
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    Relay found {findings.length}{" "}
                    {findings.length === 1
                      ? "potential issue"
                      : "potential issues"}{" "}
                    in this pull request.
                  </p>
                </div>

                <span className="text-xs font-medium text-zinc-500">
                  {findings.length} findings
                </span>
              </div>
            </div>

            {findings.length === 0 ? (
              <div className="px-5 py-10">
                <p className="text-sm font-medium text-zinc-900">
                  No issues found
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Relay did not detect any issues in the changed
                  code.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {findings.map((finding) => (
                  <article key={finding.id} className="px-5 py-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityClasses(
                            finding.severity,
                          )}`}
                        >
                          {finding.severity}
                        </span>

                        <span className="text-[11px] font-medium text-zinc-400">
                          {finding.category}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          {finding.title}
                        </h3>

                        <p className="mt-1 text-xs text-zinc-400">
                          <span className="font-mono">
                            {finding.file_path}
                          </span>

                          {finding.line !== null && (
                            <span>:{finding.line}</span>
                          )}
                        </p>
                      </div>

                      <p className="max-w-3xl text-sm leading-6 text-zinc-600">
                        {finding.explanation}
                      </p>

                      {finding.suggestion && (
                        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                            Suggested fix
                          </p>

                          <p className="mt-1 text-xs leading-5 text-zinc-600">
                            {finding.suggestion}
                          </p>
                        </div>
                      )}

                      {finding.code_snippet && (
                        <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-950 p-3 text-[11px] leading-5 text-zinc-200">
                          {finding.code_snippet}
                        </pre>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Changed files
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {files.length}{" "}
              {files.length === 1 ? "file" : "files"} changed in
              this pull request
            </p>
          </div>

          {files.length === 0 ? (
            <div className="px-5 py-8">
              <p className="text-sm text-zinc-500">
                No changed files were returned by GitHub.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {files.map((file) => (
                <div key={file.filename} className="px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0 truncate font-mono text-xs text-zinc-800">
                      {file.filename}
                    </p>

                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <span className="text-emerald-600">
                        +{file.additions}
                      </span>

                      <span className="text-red-500">
                        -{file.deletions}
                      </span>

                      <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-500">
                        {file.status}
                      </span>
                    </div>
                  </div>

                  {file.patch && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-700">
                        View diff
                      </summary>

                      <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-4 text-[11px] leading-5 text-zinc-700">
                        {file.patch}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}