import Link from "next/link";
import type { ReactNode } from "react";
import { RelayMark } from "./icons";
import { SidebarNav } from "./sidebar-nav";
import { SignOutButton } from "./sign-out-button";
import { UserProfile } from "./user-profile";

type AppShellFrameProps = {
  children: ReactNode;
  /** `undefined` renders a loading placeholder. */
  repositoryName?: string | null;
  email?: string | null;
};

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
    <div className="min-h-screen bg-background text-zinc-900">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white lg:flex">
          <div className="flex h-16 items-center px-6">
            <Logo />
          </div>

          <div className="flex-1 space-y-7 overflow-y-auto px-4 pb-4">
            <RepositorySelector repositoryName={repositoryName} />
            <SidebarNav />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
            <UserProfile email={email} />
            <SignOutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-line bg-white lg:hidden">
            <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
              <Logo />

              <div className="flex min-w-0 items-center gap-1">
                <Link
                  href="/settings"
                  className="min-w-0 truncate rounded-md border border-line px-2.5 py-1 font-mono text-xs text-zinc-800 transition-colors hover:border-zinc-400"
                  title="Change repository"
                >
                  {repositoryName === undefined
                    ? "…"
                    : (repositoryName ?? "No repository")}
                </Link>
                <SignOutButton />
              </div>
            </div>

            <div className="px-2 sm:px-4">
              <SidebarNav orientation="horizontal" />
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
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
      className="flex items-center gap-2.5 rounded-md"
      aria-label="Relay dashboard"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-[inset_0_-1px_0_rgb(0_0_0/0.4)]">
        <RelayMark className="h-4 w-4" />
      </span>
      <span className="text-[17px] font-bold tracking-[-0.02em] text-zinc-900">
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

  return (
    <Link
      href="/settings"
      className="group block rounded-xl border border-line bg-zinc-50 px-3 py-2.5 transition-colors hover:border-zinc-300 hover:bg-white"
      title={repositoryName ? `${repositoryName}: change repository` : undefined}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="meta-label">Repository</span>
        <span className="text-xs text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Change
        </span>
      </span>

      {loading ? (
        <span className="mt-1.5 block h-3.5 w-32 rounded-sm bg-zinc-100" />
      ) : repositoryName ? (
        <span
          className="mt-0.5 block truncate font-mono text-[13px] font-medium text-zinc-900"
        >
          {repositoryName}
        </span>
      ) : (
        <span className="mt-0.5 block text-[13px] text-zinc-700">
          Select a repository
        </span>
      )}
    </Link>
  );
}
