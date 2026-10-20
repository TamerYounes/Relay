import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAllPages, GitHubError } from "./api";

function page(items: unknown[], next?: string, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => items,
    text: async () => "Not Found",
    headers: new Headers(next ? { link: `<${next}>; rel="next"` } : {}),
  };
}

describe("fetchAllPages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the Link header until there's no next page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(page([1, 2], "https://api.github.com/p2"))
      .mockResolvedValueOnce(page([3]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAllPages("https://api.github.com/p1", "t")).resolves.toEqual(
      [1, 2, 3],
    );
    expect(fetchMock.mock.calls[1][0]).toBe("https://api.github.com/p2");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer t");
  });

  it("stops at maxPages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(page([1], "https://api.github.com/next"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAllPages("https://api.github.com/p1", "t", 3)).resolves.toEqual(
      [1, 1, 1],
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws a GitHubError with the response status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(page([], undefined, 404)));

    const error = await fetchAllPages("https://api.github.com/p1", "t").catch(
      (e) => e,
    );

    expect(error).toBeInstanceOf(GitHubError);
    expect(error.status).toBe(404);
  });
});
