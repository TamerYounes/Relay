import { describe, expect, it } from "vitest";
import { runRules } from "./rules";
import type { ChangedFile } from "./types";

function fileWith(lines: string[], filename = "src/app.ts"): ChangedFile {
  return {
    filename,
    status: "modified",
    additions: lines.length,
    deletions: 0,
    patch: [`@@ -0,0 +1,${lines.length} @@`, ...lines.map((l) => `+${l}`)].join(
      "\n",
    ),
  };
}

function titles(file: ChangedFile) {
  return runRules(file).map((finding) => finding.title);
}

describe("runRules", () => {
  it("flags a hardcoded secret as critical", () => {
    const [finding] = runRules(fileWith(['const apiKey = "sk_live_abcdef123456";']));

    expect(finding).toMatchObject({
      severity: "critical",
      title: "Possible hardcoded secret",
      file_path: "src/app.ts",
      line: 1,
      code_snippet: 'const apiKey = "sk_live_abcdef123456";',
    });
  });

  it("ignores short values and env lookups", () => {
    expect(
      titles(
        fileWith([
          'const password = "short";',
          "const token = process.env.GITHUB_TOKEN;",
        ]),
      ),
    ).toEqual([]);
  });

  it("flags eval() but not words that contain it", () => {
    expect(titles(fileWith(["eval(input);", "retrieval(input);"]))).toEqual([
      "Avoid eval()",
    ]);
  });

  it("flags dangerouslySetInnerHTML", () => {
    expect(
      titles(fileWith(["<div dangerouslySetInnerHTML={{ __html: body }} />"])),
    ).toEqual(["Raw HTML injection risk"]);
  });

  it("flags console.log in app code but not in tests", () => {
    expect(titles(fileWith(['console.log("here");']))).toEqual([
      "Debug logging left in production code",
    ]);
    expect(titles(fileWith(['console.log("here");'], "src/app.test.ts"))).toEqual(
      [],
    );
    expect(titles(fileWith(['console.log("here");'], "src/app.spec.tsx"))).toEqual(
      [],
    );
  });

  it("does not flag console.error", () => {
    expect(titles(fileWith(['console.error("failed");']))).toEqual([]);
  });

  it("flags TODO and FIXME markers", () => {
    expect(titles(fileWith(["// TODO: handle errors", "// FIXME later"]))).toEqual([
      "Unfinished work marker",
      "Unfinished work marker",
    ]);
  });

  it("only looks at added lines", () => {
    const file: ChangedFile = {
      filename: "src/app.ts",
      status: "modified",
      additions: 1,
      deletions: 1,
      patch: ["@@ -1,1 +1,1 @@", "-eval(input);", "+parse(input);"].join("\n"),
    };

    expect(runRules(file)).toEqual([]);
  });

  it("returns nothing for files without a patch", () => {
    expect(
      runRules({ filename: "logo.png", status: "added", additions: 0, deletions: 0 }),
    ).toEqual([]);
  });
});
