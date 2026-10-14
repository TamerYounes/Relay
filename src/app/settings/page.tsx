import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { buttonStyles } from "@/components/button-styles";
import { Panel } from "@/components/panel";
import { RelativeTime } from "@/components/relative-time";
import { createClient } from "@/lib/supabase/server";
import { GitHubRepositoryPicker } from "@/components/github-repository-picker";
import { GitHubConnectionControls } from "@/components/github-connection-controls";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ github?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, selected_repository_id")
    .eq("created_by", user?.id ?? "")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let repository = null;

  if (workspace?.selected_repository_id) {
    const { data } = await supabase
      .from("repositories")
      .select(
        "id, provider, owner, name, full_name, default_branch",
      )
      .eq("id", workspace.selected_repository_id)
      .maybeSingle();

    repository = data;
  }

  const { data: githubConnection } = await supabase
    .from("github_connections")
    .select("github_login, created_at")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  return (
    <AppShell>
      <main className="max-w-3xl space-y-8">
        <header>
          <h1 className="text-[30px] font-bold leading-tight tracking-[-0.025em] text-ink">
            Settings
          </h1>

          <p className="mt-2 text-[15px] text-ink-muted">
            Manage your GitHub connection, repository and workspace.
          </p>
        </header>

        {params.github === "connected" && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-xl bg-emerald-400/10 px-4 py-2.5 ring-1 ring-inset ring-emerald-400/25"
          >
            <p className="text-[13px] font-medium text-ink">
              GitHub connected successfully.
            </p>
          </div>
        )}

        {params.github === "error" && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl bg-red-500/10 px-4 py-2.5 ring-1 ring-inset ring-red-400/25"
          >
            <p className="text-[13px] font-medium text-ink">
              We couldn&apos;t connect GitHub. Please try again.
            </p>
          </div>
        )}

        <Panel
          title="GitHub"
          description="Relay uses your GitHub account to read repositories and pull requests."
        >
          <div className="px-4 py-4 sm:px-5">
            {githubConnection ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold uppercase text-ink-soft"
                  >
                    {githubConnection.github_login?.charAt(0) ?? "?"}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-mono text-[13px] font-medium text-ink">
                      @{githubConnection.github_login}
                    </p>

                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Connected
                      {githubConnection.created_at && (
                        <>
                          {" "}
                          <RelativeTime value={githubConnection.created_at} />
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <GitHubConnectionControls />
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">
                    GitHub isn&apos;t connected
                  </p>

                  <p className="mt-0.5 text-xs text-ink-muted">
                    Connect your account to choose a repository and review its
                    pull requests.
                  </p>
                </div>

                <Link href="/auth/github" className={buttonStyles.primary}>
                  Connect GitHub
                </Link>
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title="Repository"
          description="The repository Relay shows pull requests for."
        >
          {repository ? (
            <>
              <dl className="divide-y divide-line text-[13px]">
                <SettingRow label="Repository">
                  <a
                    href={`https://github.com/${repository.full_name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs font-medium text-ink underline-offset-2 hover:underline"
                  >
                    {repository.full_name}
                  </a>
                </SettingRow>

                <SettingRow label="Default branch">
                  <span className="rounded border border-line bg-surface px-1.5 py-px font-mono text-[12.5px] text-ink">
                    {repository.default_branch}
                  </span>
                </SettingRow>

                <SettingRow label="Status">
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Connected
                  </span>
                </SettingRow>
              </dl>

              <div className="border-t border-line px-4 py-4 sm:px-5">
                <GitHubRepositoryPicker
                  currentRepository={repository.full_name}
                />
              </div>
            </>
          ) : (
            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm font-medium text-ink">
                No repository selected
              </p>

              <p className="mb-4 mt-0.5 text-xs text-ink-muted">
                {githubConnection
                  ? "Choose one of your GitHub repositories to get started."
                  : "Connect GitHub above to choose a repository."}
              </p>

              {githubConnection && <GitHubRepositoryPicker />}
            </div>
          )}
        </Panel>

        <Panel title="Workspace" description="Your current Relay workspace.">
          <dl className="text-[13px]">
            <SettingRow label="Workspace name">
              <span className="font-medium text-ink">
                {workspace?.name ?? "No workspace"}
              </span>
            </SettingRow>
          </dl>
        </Panel>
      </main>
    </AppShell>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}
