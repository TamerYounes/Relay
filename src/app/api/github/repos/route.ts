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

  try {
    const token = decryptToken(connection.access_token_encrypted);

    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub repositories." },
        { status: response.status },
      );
    }

    const repositories = await response.json();

    return NextResponse.json(
      repositories.map(
        (repository: {
          id: number;
          name: string;
          full_name: string;
          owner: { login: string };
          default_branch: string;
          private: boolean;
        }) => ({
          id: repository.id,
          name: repository.name,
          full_name: repository.full_name,
          owner: repository.owner.login,
          default_branch: repository.default_branch,
          private: repository.private,
        }),
      ),
    );
  } catch (error) {
    console.error("GitHub repository error:", error);

    return NextResponse.json(
      { error: "Failed to access GitHub." },
      { status: 500 },
    );
  }
}