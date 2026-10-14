import Link from "next/link";
import type { ReactNode } from "react";
import { buttonStyles } from "./button-styles";
import { ExternalIcon } from "./icons";

type DashboardHeaderProps = {
  repository?: {
    full_name: string;
    default_branch?: string | null;
  } | null;
  /** Headline. Defaults to "Pull requests". */
  title?: ReactNode;
  /** One-line summary under the title. */
  summary?: ReactNode;
  /** Hide actions that change settings (the read-only demo). */
  readOnly?: boolean;
};

export function DashboardHeader({
  repository,
  title = "Pull requests",
  summary,
  readOnly = false,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[28px]">
          {title}
        </h1>

        {summary && (
          <p className="mt-1 max-w-[60ch] text-[14px] leading-6 text-ink-muted">
            {summary}
          </p>
        )}
      </div>

      {repository && (
        <div className="flex shrink-0 items-center gap-2">
          {!readOnly && (
            <Link href="/settings" className={buttonStyles.secondary}>
              Change repository
            </Link>
          )}
          <a
            href={`https://github.com/${repository.full_name}/pulls`}
            target="_blank"
            rel="noreferrer"
            className={buttonStyles.secondary}
          >
            GitHub
            <ExternalIcon className="h-3.5 w-3.5 text-ink-faint" />
          </a>
        </div>
      )}
    </header>
  );
}

/** Wraps a branch or ref name in summary text. */
export function Ref({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[13.5px] text-ink">{children}</span>
  );
}
