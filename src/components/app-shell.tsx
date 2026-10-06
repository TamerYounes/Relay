import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppShellFrame } from "./app-shell-frame";

export async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let repositoryName: string | null = null;

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

      repositoryName = repository?.full_name ?? null;
    }
  }

  return (
    <AppShellFrame repositoryName={repositoryName} email={user?.email ?? null}>
      {children}
    </AppShellFrame>
  );
}
