import { describe, expect, it, vi } from "vitest";
import { removeDuplicateFindings, reviewPullRequest } from "./index";
import type { ChangedFile, Finding } from "./types";

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    severity: "high",
    category: "Security",
    title: "Avoid eval()",
    file_path: "src/app.ts",
    line: 1,
    explanation: "Rule explanation",
    suggestion: null,
    code_snippet: null,
    ...overrides,
  };
}

const evalFile: ChangedFile = {
  filename: "src/app.ts",
  status: "modified",
  additions: 1,
  deletions: 0,
  patch: "@@ -0,0 +1,1 @@\n+eval(input);",
};

describe("removeDuplicateFindings", () => {
  it("keeps the first of findings with the same file, line and title", () => {
    const first = finding();
    const repeat = finding({ title: "AVOID EVAL()", explanation: "AI wording" });

    expect(removeDuplicateFindings([first, repeat])).toEqual([first]);
  });

  it("keeps findings on different lines or files", () => {
    const findings = [
      finding(),
      finding({ line: 2 }),
      finding({ file_path: "src/other.ts" }),
    ];

    expect(removeDuplicateFindings(findings)).toHaveLength(3);
  });
});

describe("reviewPullRequest", () => {
  it("runs only the rule checks when there's no AI server", async () => {
    const fetchImpl = vi.fn();

    const result = await reviewPullRequest([evalFile], {
      ollamaUrl: null,
      fetchImpl,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.ruleFindingsCount).toBe(1);
    expect(result.aiFindingsCount).toBe(0);
    expect(result.findings.map((f) => f.title)).toEqual(["Avoid eval()"]);
  });

  it("merges AI findings and drops ones the rules already caught", async () => {
    const aiFindings = [
      finding({ title: "avoid eval()", explanation: "Duplicate from AI" }),
      finding({ title: "Unvalidated input", line: 1, severity: "medium" }),
    ];
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: JSON.stringify({ findings: aiFindings }) }),
    });

    const result = await reviewPullRequest([evalFile], {
      ollamaUrl: "http://ollama",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.aiFindingsCount).toBe(2);
    expect(result.findings.map((f) => f.title)).toEqual([
      "Avoid eval()",
      "Unvalidated input",
    ]);
  });
});
