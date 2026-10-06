import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/github/encryption";

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
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const fullName = body.full_name?.trim();

  if (!fullName || !fullName.includes("/")) {
    return NextResponse.json(
      { error: "Invalid repository." },
      { status: 400 },
    );
  }

  const [owner, ...nameParts] = fullName.split("/");
  const name = nameParts.join("/");

  if (!owner || !name) {
    return NextResponse.json(
      { error: "Invalid repository." },
      { status: 400 },
    );
  }

  const { data: connection, error: connectionError } = await supabase
    .from("github_connections")
    .select("access_token_encrypted")
    .eq("user_id", user.id)
    .maybeSingle();

  if (connectionError || !connection) {
    return NextResponse.json(
      { error: "GitHub is not connected." },
      { status: 400 },
    );
  }

  let token: string;

  try {
    token = decryptToken(connection.access_token_encrypted);
  } catch (error) {
    console.error("Failed to decrypt GitHub token:", error);

    return NextResponse.json(
      { error: "Invalid GitHub connection." },
      { status: 500 },
    );
  }

  const githubResponse = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );

  if (!githubResponse.ok) {
    const errorBody = await githubResponse.text();

    console.error(
      "GitHub repository lookup failed:",
      githubResponse.status,
      errorBody,
    );

    return NextResponse.json(
      { error: "GitHub could not access this repository." },
      { status: githubResponse.status },
    );
  }

  const githubRepository = await githubResponse.json();

  const repositoryData = {
    provider: "github",
    owner: githubRepository.owner.login,
    name: githubRepository.name,
    full_name: githubRepository.full_name,
    default_branch: githubRepository.default_branch,
  };

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
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

  const { data: existingRepository, error: repositoryLookupError } =
    await supabase
      .from("repositories")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("full_name", githubRepository.full_name)
      .maybeSingle();

  if (repositoryLookupError) {
    console.error(
      "Repository lookup failed:",
      repositoryLookupError,
    );

    return NextResponse.json(
      { error: repositoryLookupError.message },
      { status: 500 },
    );
  }

  let repositoryId = existingRepository?.id;

  if (repositoryId) {
    const { error: updateError } = await supabase
      .from("repositories")
      .update(repositoryData)
      .eq("id", repositoryId);

    if (updateError) {
      console.error("Repository update failed:", updateError);

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }
  } else {
    const { data: newRepository, error: insertError } = await supabase
      .from("repositories")
      .insert({
        workspace_id: workspace.id,
        ...repositoryData,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Repository insert failed:", insertError);

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