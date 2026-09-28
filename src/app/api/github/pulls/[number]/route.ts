import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/github/encryption";

type RouteContext = {
  params: Promise<{
    number: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
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

  const { number } = await context.params;
  const pullRequestNumber = Number(number);

  if (!Number.isInteger(pullRequestNumber) || pullRequestNumber <= 0) {
    return NextResponse.json(
      { error: "Invalid pull request number." },
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

  if (!workspace.selected_repository_id) {
    return NextResponse.json(
      { error: "No repository selected." },
      { status: 400 },
    );
  }

  const { data: repository, error: repositoryError } = await supabase
    .from("repositories")
    .select("id, owner, name, full_name, default_branch")
    .eq("id", workspace.selected_repository_id)
    .single();

  if (repositoryError || !repository) {
    return NextResponse.json(
      { error: "Selected repository not found." },
      { status: 404 },
    );
  }

  const { data: connection, error: connectionError } = await supabase
    .from("github_connections")
    .select("access_token_encrypted")
    .eq("user_id", user.id)
    .maybeSingle();

  if (connectionError) {
    return NextResponse.json(
      { error: connectionError.message },
      { status: 500 },
    );
  }

  if (!connection) {
    return NextResponse.json(
      { error: "GitHub is not connected." },
      { status: 400 },
    );
  }

  let token: string;

  try {
    token = decryptToken(connection.access_token_encrypted);
  } catch {
    return NextResponse.json(
      { error: "Unable to decrypt GitHub connection." },
      { status: 500 },
    );
  }

  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const repositoryPath = `${encodeURIComponent(
    repository.owner,
  )}/${encodeURIComponent(repository.name)}`;

  const pullRequestResponse = await fetch(
    `https://api.github.com/repos/${repositoryPath}/pulls/${pullRequestNumber}`,
    {
      headers,
      cache: "no-store",
    },
  );

  if (!pullRequestResponse.ok) {
    const message = await pullRequestResponse.text();

    console.error(
      "GitHub pull request request failed:",
      message,
    );

    return NextResponse.json(
      { error: "Failed to load the GitHub pull request." },
      { status: pullRequestResponse.status },
    );
  }

  const pullRequest = await pullRequestResponse.json();

  const filesResponse = await fetch(
    `https://api.github.com/repos/${repositoryPath}/pulls/${pullRequestNumber}/files?per_page=100`,
    {
      headers,
      cache: "no-store",
    },
  );

  if (!filesResponse.ok) {
    const message = await filesResponse.text();

    console.error(
      "GitHub pull request files request failed:",
      message,
    );

    return NextResponse.json(
      { error: "Failed to load pull request files." },
      { status: filesResponse.status },
    );
  }

  const files = await filesResponse.json();

  return NextResponse.json({
    repository: {
      id: repository.id,
      owner: repository.owner,
      name: repository.name,
      fullName: repository.full_name,
      defaultBranch: repository.default_branch,
    },
    pullRequest: {
      number: pullRequest.number,
      title: pullRequest.title,
      body: pullRequest.body,
      state: pullRequest.state,
      draft: pullRequest.draft,
      url: pullRequest.html_url,
      author: pullRequest.user?.login ?? "Unknown",
      createdAt: pullRequest.created_at,
      updatedAt: pullRequest.updated_at,
      headSha: pullRequest.head?.sha ?? null,
      headBranch: pullRequest.head?.ref ?? null,
      baseBranch: pullRequest.base?.ref ?? null,
      additions: pullRequest.additions ?? 0,
      deletions: pullRequest.deletions ?? 0,
      changedFiles: pullRequest.changed_files ?? 0,
    },
    files: files.map(
      (file: {
        sha?: string;
        filename: string;
        status: string;
        additions?: number;
        deletions?: number;
        changes?: number;
        patch?: string;
        blob_url?: string;
        raw_url?: string;
      }) => ({
        sha: file.sha ?? null,
        filename: file.filename,
        status: file.status,
        additions: file.additions ?? 0,
        deletions: file.deletions ?? 0,
        changes: file.changes ?? 0,
        patch: file.patch ?? null,
        blobUrl: file.blob_url ?? null,
        rawUrl: file.raw_url ?? null,
      }),
    ),
  });
}