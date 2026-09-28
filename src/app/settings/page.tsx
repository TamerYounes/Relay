import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GitHubRepositoryPicker } from "@/components/github-repository-picker";

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
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs text-zinc-400 transition-colors hover:text-zinc-700"
        >
          ← Back to overview
        </Link>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
          Settings
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Manage your Relay workspace and repository.
        </p>
      </div>

      {params.github === "connected" && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800">
            GitHub connected successfully.
          </p>
        </div>
      )}

      {params.github === "error" && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            We couldn't connect GitHub. Please try again.
          </p>
        </div>
      )}

      <div className="max-w-2xl">
        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Workspace
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Your current Relay workspace.
            </p>
          </div>

          <div className="px-5 py-5">
            <p className="text-xs text-zinc-400">
              Workspace name
            </p>

            <p className="mt-1 text-sm font-medium text-zinc-900">
              {workspace?.name ?? "No workspace"}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              GitHub
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Connect GitHub to access your repositories and pull requests.
            </p>
          </div>

          <div className="px-5 py-5">
            {githubConnection ? (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700">
                  GH
                </span>

                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    @{githubConnection.github_login}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                    <span className="text-xs text-zinc-500">
                      Connected
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Connect your GitHub account
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Relay will use GitHub to access your repositories and pull
                    requests.
                  </p>
                </div>

                <Link
                  href="/auth/github"
                  className="shrink-0 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Connect GitHub
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Connected repository
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Repository Relay is currently connected to.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            {repository ? (
              <>
                <div>
                  <p className="text-xs text-zinc-400">
                    Repository
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                      GH
                    </span>

                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {repository.full_name}
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-400">
                        GitHub repository
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 border-t border-zinc-100 pt-5">
                  <div>
                    <p className="text-xs text-zinc-400">
                      Default branch
                    </p>

                    <p className="mt-1 font-mono text-xs text-zinc-700">
                      {repository.default_branch}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-400">
                      Status
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      <span className="text-xs text-zinc-700">
                        Connected
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-5">
                  <GitHubRepositoryPicker
                    currentRepository={repository.full_name}
                  />
                </div>
              </>
            ) : (
              <div className="py-4">
                <p className="mb-4 text-sm text-zinc-600">
                  No repository connected.
                </p>

                {githubConnection && <GitHubRepositoryPicker />}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}