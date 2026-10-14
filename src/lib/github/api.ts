export function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Fetches every page of a GitHub list endpoint by following the `Link`
 * header. `maxPages` keeps a runaway list from blocking a request.
 */
export async function fetchAllPages<T>(
  url: string,
  token: string,
  maxPages = 10,
): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = url;

  for (let page = 0; next && page < maxPages; page++) {
    const response: Response = await fetch(next, {
      headers: githubHeaders(token),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new GitHubError(
        response.status,
        `GitHub API ${response.status}: ${await response.text()}`,
      );
    }

    items.push(...((await response.json()) as T[]));
    next = getNextPageUrl(response.headers.get("link"));
  }

  return items;
}

function getNextPageUrl(linkHeader: string | null) {
  const match = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}
