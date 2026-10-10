import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GitHubError, githubFetchAll, getGitHubToken } from "@/lib/github/api";

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  default_branch: string;
  private: boolean;
  archived: boolean;
};

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  try {
    const repositories = await githubFetchAll<GitHubRepository>(
      token,
      "/user/repos?sort=updated&affiliation=owner,collaborator,organization_member",
    );

    return NextResponse.json(
      repositories
        .filter((repository) => !repository.archived)
        .map((repository) => ({
          id: repository.id,
          name: repository.name,
          full_name: repository.full_name,
          owner: repository.owner.login,
          default_branch: repository.default_branch,
          private: repository.private,
        })),
    );
  } catch (error) {
    console.error("GitHub repository fetch failed:", error);

    if (error instanceof GitHubError && error.status === 401) {
      return NextResponse.json(
        { error: "GitHub rejected the saved token. Reconnect GitHub." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Couldn't load repositories from GitHub." },
      { status: 502 },
    );
  }
}
