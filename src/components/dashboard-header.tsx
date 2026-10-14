import Link from "next/link";
import type { ReactNode } from "react";
import { buttonStyles } from "./button-styles";
import { ExternalIcon } from "./icons";

type DashboardHeaderProps = {
  repository?: {
    full_name: string;
    default_branch?: string | null;
  } | null;
  /** One-line summary under the title. */
  summary?: ReactNode;
};

export function DashboardHeader({ repository, summary }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[32px] font-bold leading-tight tracking-[-0.03em] text-zinc-900">
          Pull requests
        </h1>

        {summary && (
          <p className="mt-1.5 max-w-[60ch] text-[15px] leading-6 text-zinc-600">
            {summary}
          </p>
        )}
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
            <ExternalIcon className="h-3.5 w-3.5 text-zinc-400" />
          </a>
        </div>
      )}
    </header>
  );
}

/** Wraps a branch or ref name in summary text. */
export function Ref({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[13.5px] text-zinc-900">{children}</span>
  );
}
