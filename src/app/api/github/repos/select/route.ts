import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: {
    full_name?: string;
    owner?: string;
    name?: string;
    default_branch?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const {
    full_name,
    owner,
    name,
    default_branch,
  } = body;

  if (!full_name || !owner || !name || !default_branch) {
    return NextResponse.json(
      { error: "Invalid repository." },
      { status: 400 },
    );
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, selected_repository_id")
    .eq("created_by", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (workspaceError) {
    console.error("Workspace lookup failed:", workspaceError);

    return NextResponse.json(
      { error: workspaceError.message },
      { status: 500 },
    );
  }

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found." },
      { status: 404 },
    );
  }

  const { data: repository, error: repositoryError } = await supabase
    .from("repositories")
    .select(
      "id, workspace_id, provider, owner, name, full_name, default_branch",
    )
    .eq("workspace_id", workspace.id)
    .eq("full_name", full_name)
    .maybeSingle();

  if (repositoryError) {
    console.error("Repository lookup failed:", repositoryError);

    return NextResponse.json(
      { error: repositoryError.message },
      { status: 500 },
    );
  }

  let repositoryId = repository?.id;

  if (!repository) {
    const { data: newRepository, error: insertError } = await supabase
      .from("repositories")
      .insert({
        workspace_id: workspace.id,
        provider: "github",
        owner,
        name,
        full_name,
        default_branch,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create repository:", insertError);

      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    repositoryId = newRepository.id;
  }

  const { error: workspaceUpdateError } = await supabase
    .from("workspaces")
    .update({
      selected_repository_id: repositoryId,
    })
    .eq("id", workspace.id);

  if (workspaceUpdateError) {
    console.error(
      "Failed to select repository:",
      workspaceUpdateError,
    );

    return NextResponse.json(
      { error: workspaceUpdateError.message },
      { status: 500 },
    );
  }

  const { data: selectedRepository, error: selectedRepositoryError } =
    await supabase
      .from("repositories")
      .select(
        "id, workspace_id, provider, owner, name, full_name, default_branch",
      )
      .eq("id", repositoryId)
      .single();

  if (selectedRepositoryError) {
    console.error(
      "Failed to load selected repository:",
      selectedRepositoryError,
    );

    return NextResponse.json(
      { error: selectedRepositoryError.message },
      { status: 500 },
    );
  }

  return NextResponse.json(selectedRepository);
}