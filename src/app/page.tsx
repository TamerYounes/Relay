import { AppShell } from "@/components/app-shell";
import { DashboardHeader } from "@/components/dashboard-header";
import { MetricCard } from "@/components/metric-card";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/github/encryption";

type GitHubPullRequest = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  user?: {
    login: string;
  };
  head?: {
    ref: string;
  };
  base?: {
    ref: string;
  };
  created_at: string;
  updated_at: string;
};

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
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10">
          <p className="text-sm font-medium text-zinc-900">
            No workspace found
          </p>
        </div>
      </AppShell>
    );
  }

  if (!workspace.selected_repository_id) {
    return (
      <AppShell>
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10">
          <p className="text-sm font-medium text-zinc-900">
            No repository connected
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Select a GitHub repository in Settings to get started.
          </p>
        </div>
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
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10">
          <p className="text-sm font-medium text-zinc-900">
            Repository not found
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Select a different repository in Settings.
          </p>
        </div>
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
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-10">
          <p className="text-sm font-medium text-zinc-900">
            GitHub is not connected
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Connect your GitHub account in Settings to view pull requests.
          </p>
        </div>
      </AppShell>
    );
  }

  let pullRequests: GitHubPullRequest[] = [];

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
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch pull requests from GitHub.");
    }

    pullRequests = await response.json();
  } catch (error) {
    console.error("Failed to load GitHub pull requests:", error);

    return (
      <AppShell>
        <main className="space-y-8">
          <DashboardHeader />

          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-medium text-red-800">
              Couldn't load pull requests from GitHub.
            </p>

            <p className="mt-1 text-xs text-red-600">
              Check that your GitHub connection is still active.
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="space-y-8">
        <DashboardHeader />

        <section
          aria-label="Review metrics"
          className="grid overflow-hidden rounded-lg border border-zinc-200 bg-white sm:grid-cols-2 lg:grid-cols-4"
        >
          <MetricCard
            label="Open PRs"
            value={String(pullRequests.length)}
            detail={`Open pull requests in ${repository.full_name}`}
          />

          <MetricCard
            label="Reviewed PRs"
            value="0"
            detail="Completed Relay reviews"
          />

          <MetricCard
            label="Needs attention"
            value="0"
            detail="Open follow-up required"
          />

          <MetricCard
            label="Security findings"
            value="0"
            detail="Detected by Relay"
          />
        </section>

        <section aria-label="Pull requests">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Pull requests
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Open pull requests from{" "}
              <span className="font-mono text-zinc-700">
                {repository.full_name}
              </span>
            </p>
          </div>

          {pullRequests.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-900">
                No open pull requests
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                This repository currently has no open pull requests.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              {pullRequests.map((pullRequest, index) => (
                <a
                  key={pullRequest.id}
                  href={`/pull-requests/${pullRequest.number}`}
                  className={`block px-5 py-4 transition-colors hover:bg-zinc-50 ${
                    index !== pullRequests.length - 1
                      ? "border-b border-zinc-100"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-400">
                          #{pullRequest.number}
                        </span>

                        {pullRequest.draft && (
                          <span className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                            Draft
                          </span>
                        )}
                      </div>

                      <h2 className="mt-1 truncate text-sm font-medium text-zinc-900">
                        {pullRequest.title}
                      </h2>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
                        <span>
                          {pullRequest.user?.login ?? "Unknown"}
                        </span>

                        <span>·</span>

                        <span className="font-mono">
                          {pullRequest.head?.ref ?? ""}
                        </span>

                        <span>→</span>

                        <span className="font-mono">
                          {pullRequest.base?.ref ?? ""}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs text-zinc-400">
                      View details →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}