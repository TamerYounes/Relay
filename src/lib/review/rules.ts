import { getAddedLines } from "./diff";
import type { ChangedFile, Finding } from "./types";

type Rule = Omit<Finding, "file_path" | "line" | "code_snippet"> & {
  matches: (content: string, filename: string) => boolean;
};

const testFile = /\.(test|spec)\.[jt]sx?$/;

export const rules: Rule[] = [
  {
    severity: "critical",
    category: "Security",
    title: "Possible hardcoded secret",
    explanation:
      "This line appears to contain a secret, password, token, or API key directly in source code.",
    suggestion:
      "Move the secret into an environment variable or another secure secret store.",
    matches: (content) =>
      /(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}["']/i.test(
        content,
      ),
  },
  {
    severity: "high",
    category: "Security",
    title: "Avoid eval()",
    explanation:
      "eval() executes a string as code and can turn untrusted input into arbitrary code execution.",
    suggestion:
      "Replace eval() with explicit parsing or a safer API that does not execute arbitrary code.",
    matches: (content) => /\beval\s*\(/.test(content),
  },
  {
    severity: "high",
    category: "Security",
    title: "Raw HTML injection risk",
    explanation:
      "dangerouslySetInnerHTML bypasses React's normal HTML escaping and can introduce cross-site scripting when the rendered content is not fully trusted.",
    suggestion:
      "Avoid raw HTML where possible. If it is required, sanitize the content before rendering it.",
    matches: (content) => /dangerouslySetInnerHTML\s*=/.test(content),
  },
  {
    severity: "low",
    category: "Code quality",
    title: "Debug logging left in production code",
    explanation:
      "This change adds console logging that may be useful during development but can create unnecessary production logs.",
    suggestion:
      "Remove the debug statement or replace it with the application's normal logging system if the message is intentionally retained.",
    matches: (content, filename) =>
      /\bconsole\.(log|debug|info)\s*\(/.test(content) &&
      !testFile.test(filename),
  },
  {
    severity: "low",
    category: "Code quality",
    title: "Unfinished work marker",
    explanation:
      "This change introduces a TODO or FIXME marker, which may indicate unfinished work or a known issue.",
    suggestion:
      "Complete the work before merging or track it in an issue if it is intentionally deferred.",
    matches: (content) => /\bTODO\b|\bFIXME\b/.test(content),
  },
];

/** Runs every rule against the lines a file's diff adds. */
export function runRules(file: ChangedFile): Finding[] {
  if (!file.patch) {
    return [];
  }

  const findings: Finding[] = [];

  for (const added of getAddedLines(file.patch)) {
    for (const { matches, ...rule } of rules) {
      if (matches(added.content, file.filename)) {
        findings.push({
          ...rule,
          file_path: file.filename,
          line: added.line,
          code_snippet: added.content.trim(),
        });
      }
    }
  }

  return findings;
}
