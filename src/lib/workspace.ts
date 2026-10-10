import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function getOrCreateWorkspace(
  supabase: SupabaseClient,
  user: User,
) {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, selected_repository_id")
    .eq("created_by", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || workspace) {
    return { workspace, error };
  }

  const name = user.email ? user.email.split("@")[0] : "My workspace";

  const { data: created, error: createError } = await supabase
    .from("workspaces")
    .insert({ name, created_by: user.id })
    .select("id, selected_repository_id")
    .single();

  return { workspace: created, error: createError };
}
