import Link from "next/link";
import type { ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";
import { SignOutButton } from "./sign-out-button";
import { UserProfile } from "./user-profile";

type AppShellFrameProps = {
  children: ReactNode;
  /** `undefined` renders a loading placeholder. */
  repositoryName?: string | null;
  email?: string | null;
};

const darkSignOut =
  "shrink-0 rounded-sm px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-white/5 hover:text-white";

/**
 * Presentational shell. Used directly by loading states, which can't wait for
 * the data `AppShell` fetches.
 */
export function AppShellFrame({
  children,
  repositoryName,
  email,
}: AppShellFrameProps) {
  return (
    <div className="min-h-screen bg-background text-zinc-950">
      <div className="flex min-h-screen">
        <aside data-surface="ink" className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-line bg-ink text-zinc-300 lg:flex">
          <div className="flex h-14 items-center px-4">
            <Logo />
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <RepositorySelector repositoryName={repositoryName} />

            <p className="eyebrow mb-2 mt-7 px-2.5 text-ink-muted">Workspace</p>

            <SidebarNav />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-ink-line px-3 py-3">
            <UserProfile email={email} />
            <SignOutButton className={darkSignOut} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header data-surface="ink" className="sticky top-0 z-10 bg-ink text-zinc-300 lg:hidden">
            <div className="flex h-12 items-center justify-between gap-4 px-4 sm:px-6">
              <Logo />

              <div className="flex min-w-0 items-center gap-1">
                <Link
                  href="/settings"
                  className="flex min-w-0 items-center gap-1.5 truncate rounded-sm border border-ink-line px-2 py-1 font-mono text-[11px] text-zinc-200 transition-colors hover:border-zinc-600"
                  title="Change repository"
                >
                  {repositoryName && (
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-signal" />
                  )}
                  <span className="truncate">
                    {repositoryName === undefined
                      ? "…"
                      : (repositoryName ?? "No repository")}
                  </span>
                </Link>
                <SignOutButton className={darkSignOut} />
              </div>
            </div>

            <div className="border-t border-ink-line px-2 sm:px-4">
              <SidebarNav orientation="horizontal" />
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-sm"
      aria-label="Relay dashboard"
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-xs bg-signal font-mono text-[13px] font-bold text-ink"
      >
        R
      </span>

      <span className="text-[15px] font-semibold tracking-tight text-white">
        Relay
      </span>
    </Link>
  );
}

function RepositorySelector({
  repositoryName,
}: {
  repositoryName?: string | null;
}) {
  const loading = repositoryName === undefined;
  const [owner, name] = repositoryName?.split("/") ?? [];

  return (
    <Link
      href="/settings"
      className="group block rounded-sm border border-ink-line bg-ink-raised px-3 py-2.5 transition-colors hover:border-zinc-600"
      title={repositoryName ? `${repositoryName} — change repository` : undefined}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="eyebrow text-ink-muted">Repository</span>
        <span className="text-[11px] text-ink-muted transition-colors group-hover:text-zinc-200">
          Change
        </span>
      </span>

      {loading ? (
        <span className="mt-2 block space-y-1.5">
          <span className="block h-2.5 w-14 rounded-xs bg-ink-line" />
          <span className="block h-3 w-28 rounded-xs bg-ink-line" />
        </span>
      ) : repositoryName ? (
        <span className="mt-1.5 block min-w-0">
          <span className="block truncate font-mono text-[11px] text-ink-muted">
            {owner} /
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-label="Connected"
              className="h-1.5 w-1.5 shrink-0 bg-signal"
            />
            <span className="truncate font-mono text-[13px] font-medium text-white">
              {name}
            </span>
          </span>
        </span>
      ) : (
        <span className="mt-1.5 flex items-center gap-2">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 border border-ink-muted" />
          <span className="text-[13px] text-zinc-200">Select a repository</span>
        </span>
      )}
    </Link>
  );
}
