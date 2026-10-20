import { describe, expect, it } from "vitest";
import { getAddedLines } from "./diff";

describe("getAddedLines", () => {
  it("numbers added lines by their position in the new file", () => {
    const patch = [
      "@@ -1,3 +1,4 @@",
      " const a = 1;",
      "+const b = 2;",
      " const c = 3;",
      "+const d = 4;",
    ].join("\n");

    expect(getAddedLines(patch)).toEqual([
      { line: 2, content: "const b = 2;" },
      { line: 4, content: "const d = 4;" },
    ]);
  });

  it("does not count removed lines", () => {
    const patch = [
      "@@ -10,3 +10,3 @@",
      " keep();",
      "-oldCall();",
      "+newCall();",
      " keep();",
    ].join("\n");

    expect(getAddedLines(patch)).toEqual([{ line: 11, content: "newCall();" }]);
  });

  it("restarts numbering at each hunk", () => {
    const patch = [
      "@@ -1,1 +1,2 @@",
      " first();",
      "+second();",
      "@@ -50,1 +51,2 @@",
      " later();",
      "+added();",
    ].join("\n");

    expect(getAddedLines(patch).map((l) => l.line)).toEqual([2, 52]);
  });

  it("ignores file headers and no-newline markers", () => {
    const patch = [
      "--- a/file.ts",
      "+++ b/file.ts",
      "@@ -1,1 +1,2 @@",
      " a();",
      "\\ No newline at end of file",
      "+b();",
    ].join("\n");

    expect(getAddedLines(patch)).toEqual([{ line: 2, content: "b();" }]);
  });

  it("returns nothing for an empty patch", () => {
    expect(getAddedLines("")).toEqual([]);
  });
});
