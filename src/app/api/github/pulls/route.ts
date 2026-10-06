import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/github/encryption";

export async function GET() {
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
  } catch (error) {
    console.error("GitHub token decryption failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to decrypt GitHub connection.",
      },
      { status: 500 },
    );
  }

  try {
    const githubResponse = await fetch(
      `https://api.github.com/repos/${repository.full_name}/pulls?state=open&per_page=50`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        cache: "no-store",
      },
    );

    if (!githubResponse.ok) {
      const message = await githubResponse.text();

      console.error("GitHub pull request request failed:", message);

      return NextResponse.json(
        {
          error: `GitHub API error: ${githubResponse.status}`,
        },
        { status: githubResponse.status },
      );
    }

    const pullRequests = await githubResponse.json();

    return NextResponse.json({
      repository,
      pullRequests: pullRequests.map(
        (pullRequest: {
          number: number;
          title: string;
          state: string;
          draft: boolean;
          html_url: string;
          user?: { login?: string };
          created_at: string;
          updated_at: string;
          head?: { sha?: string; ref?: string };
          base?: { ref?: string };
          additions?: number;
          deletions?: number;
          changed_files?: number;
        }) => ({
          number: pullRequest.number,
          title: pullRequest.title,
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
        }),
      ),
    });
  } catch (error) {
    console.error("GitHub pull request fetch failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch pull requests from GitHub.",
      },
      { status: 500 },
    );
  }
}