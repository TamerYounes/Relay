import type { createClient } from "@/lib/supabase/server";
import { decryptToken } from "./encryption";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Relay",
  };
}

export async function githubFetch<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { ...githubHeaders(token), ...init.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new GitHubError(
      response.status,
      `GitHub API ${response.status} on ${path}: ${body.slice(0, 200)}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function githubFetchAll<T>(
  token: string,
  path: string,
  maxPages = 5,
): Promise<T[]> {
  const items: T[] = [];
  const separator = path.includes("?") ? "&" : "?";

  for (let page = 1; page <= maxPages; page++) {
    const batch = await githubFetch<T[]>(
      token,
      `${path}${separator}per_page=100&page=${page}`,
    );

    items.push(...batch);

    if (batch.length < 100) {
      break;
    }
  }

  return items;
}

export async function getGitHubToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("github_connections")
    .select("access_token_encrypted")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? decryptToken(data.access_token_encrypted) : null;
}
