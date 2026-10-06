import Link from "next/link";
import { buttonStyles } from "./button-styles";

type DashboardHeaderProps = {
  repository?: {
    full_name: string;
    default_branch?: string | null;
  } | null;
};

export function DashboardHeader({ repository }: DashboardHeaderProps) {
  const [owner, name] = repository?.full_name.split("/") ?? [];

  return (
    <header className="flex flex-col gap-4 border-b border-zinc-300 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {repository ? (
          <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-zinc-500">
            <span className="truncate">
              {owner} <span className="text-zinc-300">/</span>{" "}
              <span className="font-medium text-zinc-900">{name}</span>
            </span>
            {repository.default_branch && (
              <span className="rounded-xs border border-zinc-300 bg-white px-1.5 text-[11px] leading-4.5 text-zinc-600">
                {repository.default_branch}
              </span>
            )}
          </p>
        ) : (
          <p className="eyebrow text-zinc-400">No repository</p>
        )}

        <h1 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-zinc-950">
          Pull requests
        </h1>
      </div>

      {repository && (
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/settings" className={buttonStyles.secondary}>
            Change repository
          </Link>

          <a
            href={`https://github.com/${repository.full_name}/pulls`}
            target="_blank"
            rel="noreferrer"
            className={buttonStyles.secondary}
          >
            GitHub
            <span aria-hidden="true" className="text-zinc-400">
              ↗
            </span>
          </a>
        </div>
      )}
    </header>
  );
}
