import Link from "next/link";

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
};

export function PullRequestList({
  pullRequests,
}: {
  pullRequests: GitHubPullRequest[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">
              Pull requests
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Open pull requests from GitHub
            </p>
          </div>
        </div>
      </div>

      <div className="hidden grid-cols-[minmax(0,1fr)_280px] border-b border-zinc-100 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 md:grid">
        <span>Pull request</span>

        <div className="grid grid-cols-2 gap-4">
          <span>Branch</span>
          <span>Status</span>
        </div>
      </div>

      <ul className="divide-y divide-zinc-200">
        {pullRequests.map((pullRequest) => (
          <li key={pullRequest.id}>
            <Link
              href={`/pull-requests/${pullRequest.number}`}
              className="block px-5 py-4 transition-colors hover:bg-zinc-50"
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
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

                  <h3 className="mt-1 truncate text-sm font-medium text-zinc-900">
                    {pullRequest.title}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-400">
                    {pullRequest.user?.login ?? "Unknown"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-zinc-500">
                      {pullRequest.head?.ref ?? ""}
                    </p>

                    <p className="mt-0.5 truncate font-mono text-zinc-400">
                      → {pullRequest.base?.ref ?? ""}
                    </p>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1.5 text-zinc-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Open
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}