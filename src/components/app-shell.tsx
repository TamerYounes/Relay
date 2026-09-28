import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";
import { UserProfile } from "./user-profile";

export async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let repositoryName = "No repository";

  if (user) {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, selected_repository_id")
      .eq("created_by", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (workspace?.selected_repository_id) {
      const { data: repository } = await supabase
        .from("repositories")
        .select("full_name")
        .eq("id", workspace.selected_repository_id)
        .maybeSingle();

      repositoryName = repository?.full_name ?? "No repository";
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-zinc-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-16 items-center border-b border-zinc-200 px-5">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="Relay dashboard"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3b4fd8] text-xs font-semibold text-white">
                R
              </span>

              <span className="text-sm font-semibold tracking-tight">
                Relay
              </span>
            </Link>
          </div>

          <div className="flex-1 px-3 py-5">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Workspace
            </p>

            <nav className="mt-2 space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-md bg-[#eef0ff] px-3 py-2 text-sm font-medium text-[#3444b8]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#3b4fd8]" />
                Overview
              </Link>

              <Link
                href="/"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                <span className="h-1.5 w-1.5 rounded-full border border-zinc-300" />
                Pull requests
              </Link>

              <Link
                href="/"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                <span className="h-1.5 w-1.5 rounded-full border border-zinc-300" />
                Findings
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              >
                <span className="h-1.5 w-1.5 rounded-full border border-zinc-300" />
                Settings
              </Link>
            </nav>

            <div className="mt-8">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Repository
              </p>

              <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  <p className="font-mono text-xs font-medium text-zinc-800">
                    {repositoryName}
                  </p>
                </div>

                <p className="mt-1 pl-4 text-xs text-zinc-400">
                  Connected repository
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 p-3">
            <UserProfile />
            <SignOutButton />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6 lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="Relay dashboard"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3b4fd8] text-xs font-semibold text-white">
                R
              </span>

              <span className="text-sm font-semibold tracking-tight">
                Relay
              </span>
            </Link>

            <span className="text-xs text-zinc-500">
              {repositoryName}
            </span>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}