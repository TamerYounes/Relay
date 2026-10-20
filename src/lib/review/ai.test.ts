import { describe, expect, it, vi } from "vitest";
import {
  buildDiffForPrompt,
  normalizeAiFinding,
  parseAiResponse,
  runAiReview,
} from "./ai";
import type { ChangedFile } from "./types";

const validFinding = {
  severity: "high",
  category: "Bug",
  title: "Wrong conversion",
  file_path: "src/temp.ts",
  line: 4,
  explanation: "Adds 32 without multiplying by 9/5.",
  suggestion: "Use c * 9 / 5 + 32.",
  code_snippet: "return c + 32;",
};

function file(filename: string, patch: string): ChangedFile {
  return { filename, status: "modified", additions: 1, deletions: 0, patch };
}

describe("normalizeAiFinding", () => {
  it("keeps a well-formed finding", () => {
    expect(normalizeAiFinding(validFinding)).toEqual(validFinding);
  });

  it("drops findings with an unknown severity or missing text", () => {
    expect(normalizeAiFinding({ ...validFinding, severity: "urgent" })).toBeNull();
    expect(normalizeAiFinding({ ...validFinding, title: "  " })).toBeNull();
    expect(normalizeAiFinding({ ...validFinding, explanation: undefined })).toBeNull();
    expect(normalizeAiFinding(null)).toBeNull();
    expect(normalizeAiFinding("not an object")).toBeNull();
  });

  it("fills in defaults for optional fields", () => {
    expect(
      normalizeAiFinding({
        severity: "low",
        title: " Title ",
        explanation: " Why ",
        line: -3,
      }),
    ).toEqual({
      severity: "low",
      category: "Bug",
      title: "Title",
      file_path: "Unknown file",
      line: null,
      explanation: "Why",
      suggestion: null,
      code_snippet: null,
    });
  });

  it("rejects non-integer line numbers", () => {
    expect(normalizeAiFinding({ ...validFinding, line: 2.5 })?.line).toBeNull();
    expect(normalizeAiFinding({ ...validFinding, line: "4" })?.line).toBeNull();
  });
});

describe("parseAiResponse", () => {
  it("returns valid findings and drops invalid ones", () => {
    const response = JSON.stringify({
      findings: [validFinding, { severity: "nope" }],
    });

    expect(parseAiResponse(response)).toEqual([validFinding]);
  });

  it("treats an empty list as no findings", () => {
    expect(parseAiResponse('{"findings":[]}')).toEqual([]);
  });

  it("returns null for output it can't use", () => {
    expect(parseAiResponse("not json")).toBeNull();
    expect(parseAiResponse('{"issues":[]}')).toBeNull();
    expect(parseAiResponse("null")).toBeNull();
  });
});

describe("buildDiffForPrompt", () => {
  it("skips files without a patch", () => {
    const { diff } = buildDiffForPrompt([
      file("a.ts", "+a();"),
      { filename: "logo.png", status: "added", additions: 0, deletions: 0 },
    ]);

    expect(diff).toContain("FILE: a.ts");
    expect(diff).not.toContain("logo.png");
  });

  it("never cuts a file in half when over the limit", () => {
    const small = file("small.ts", "+a();");
    const large = file("large.ts", `+${"x".repeat(500)}`);

    const { diff, skipped } = buildDiffForPrompt([small, large], 200);

    expect(diff).toContain("FILE: small.ts");
    expect(diff).not.toContain("large.ts");
    expect(skipped).toEqual(["large.ts"]);
  });
});

describe("runAiReview", () => {
  const files = [file("src/temp.ts", "+return c + 32;")];

  function ollamaReply(body: unknown, ok = true) {
    return vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
      text: async () => "server error",
    });
  }

  it("returns parsed findings from the model", async () => {
    const fetchImpl = ollamaReply({
      response: JSON.stringify({ findings: [validFinding] }),
    });

    await expect(
      runAiReview(files, "http://ollama", fetchImpl as unknown as typeof fetch),
    ).resolves.toEqual([validFinding]);

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("http://ollama/api/generate");
    expect(JSON.parse(init.body).prompt).toContain("FILE: src/temp.ts");
  });

  it("returns no findings when the server fails or replies badly", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    for (const fetchImpl of [
      ollamaReply({}, false),
      ollamaReply({ response: 42 }),
      ollamaReply({ response: "not json" }),
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    ]) {
      await expect(
        runAiReview(files, "http://ollama", fetchImpl as unknown as typeof fetch),
      ).resolves.toEqual([]);
    }
  });

  it("doesn't call the model when there's nothing to review", async () => {
    const fetchImpl = vi.fn();

    await runAiReview([], "http://ollama", fetchImpl);

    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
