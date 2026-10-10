import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GitHubError, githubFetch, getGitHubToken } from "@/lib/github/api";
import { syncRecentPullRequests } from "@/lib/github/sync";
import { ensureRepositoryWebhook, getWebhookUrl } from "@/lib/github/webhooks";
import { getOrCreateWorkspace } from "@/lib/workspace";

export const maxDuration = 60;

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { full_name?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const [owner, name, ...rest] = body.full_name?.trim().split("/") ?? [];

  if (!owner || !name || rest.length > 0) {
    return NextResponse.json(
      { error: "Invalid repository." },
      { status: 400 },
    );
  }

  let token: string | null;

  try {
    token = await getGitHubToken(supabase, user.id);
  } catch (error) {
    console.error("GitHub connection lookup failed:", error);

    return NextResponse.json(
      { error: "Couldn't read your GitHub connection." },
      { status: 500 },
    );
  }

  if (!token) {
    return NextResponse.json(
      { error: "GitHub is not connected." },
      { status: 400 },
    );
  }

  let githubRepository: GitHubRepository;

  try {
    githubRepository = await githubFetch<GitHubRepository>(
      token,
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    );
  } catch (error) {
    console.error("GitHub repository lookup failed:", error);

    const status = error instanceof GitHubError ? error.status : 502;

    return NextResponse.json(
      { error: "GitHub could not access this repository." },
      { status: status === 404 || status === 403 ? status : 502 },
    );
  }

  const { workspace, error: workspaceError } = await getOrCreateWorkspace(
    supabase,
    user,
  );

  if (!workspace) {
    console.error("Workspace lookup failed:", workspaceError);

    return NextResponse.json(
      { error: "Couldn't find or create your workspace." },
      { status: 500 },
    );
  }

  const repositoryData = {
    provider: "github",
    github_repo_id: githubRepository.id,
    owner: githubRepository.owner.login,
    name: githubRepository.name,
    full_name: githubRepository.full_name,
    default_branch: githubRepository.default_branch,
  };

  const { data: existingRepository, error: lookupError } = await supabase
    .from("repositories")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("full_name", githubRepository.full_name)
    .maybeSingle();

  if (lookupError) {
    console.error("Repository lookup failed:", lookupError);

    return NextResponse.json(
      { error: lookupError.message },
      { status: 500 },
    );
  }

  const { data: repository, error: saveError } = existingRepository
    ? await supabase
        .from("repositories")
        .update(repositoryData)
        .eq("id", existingRepository.id)
        .select("id, workspace_id, provider, owner, name, full_name, default_branch")
        .single()
    : await supabase
        .from("repositories")
        .insert({ workspace_id: workspace.id, ...repositoryData })
        .select("id, workspace_id, provider, owner, name, full_name, default_branch")
        .single();

  if (saveError || !repository) {
    console.error("Repository save failed:", saveError);

    return NextResponse.json(
      { error: saveError?.message ?? "Couldn't save repository." },
      { status: 500 },
    );
  }

  const { error: selectError } = await supabase
    .from("workspaces")
    .update({ selected_repository_id: repository.id })
    .eq("id", workspace.id);

  if (selectError) {
    console.error("Failed to select repository:", selectError);

    return NextResponse.json(
      { error: selectError.message },
      { status: 500 },
    );
  }

  const githubToken = token;
  const origin = new URL(request.url).origin;

  after(() => setUpSync(githubToken, repository, origin));

  return NextResponse.json(repository);
}

async function setUpSync(
  token: string,
  repository: { id: string; owner: string; name: string },
  origin: string,
) {
  const admin = createAdminClient();

  if (!admin) {
    console.warn("SUPABASE_SECRET_KEY is not set, skipping pull request sync.");
    return;
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const webhookUrl = getWebhookUrl(origin);

  if (secret && webhookUrl) {
    try {
      const webhookId = await ensureRepositoryWebhook(
        token,
        repository.owner,
        repository.name,
        webhookUrl,
        secret,
      );

      await admin
        .from("repositories")
        .update({ webhook_id: webhookId })
        .eq("id", repository.id);
    } catch (error) {
      console.error("Webhook setup failed:", error);

      await admin
        .from("repositories")
        .update({ webhook_id: null })
        .eq("id", repository.id);
    }
  }

  try {
    await syncRecentPullRequests(admin, token, repository);
  } catch (error) {
    console.error("Pull request sync failed:", error);
  }
}
