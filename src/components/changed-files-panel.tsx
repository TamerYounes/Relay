import { fileAnchorId, pluralize } from "@/lib/format";
import type { GitHubFile } from "@/types/relay";
import { EmptyState } from "./empty-state";
import { Count, Panel } from "./panel";

const fileStatusStyles: Record<string, { label: string; className: string }> = {
  added: { label: "A", className: "text-emerald-400" },
  removed: { label: "D", className: "text-red-400" },
  modified: { label: "M", className: "text-ink-muted" },
  renamed: { label: "R", className: "text-ink-muted" },
  copied: { label: "C", className: "text-ink-muted" },
};

const defaultFileStatus = {
  label: "•",
  className: "text-ink-muted",
};

export function ChangedFilesPanel({
  files,
  findingsByFile,
}: {
  files: GitHubFile[];
  /** Finding counts keyed by file path. */
  findingsByFile: Map<string, number>;
}) {
  const additions = files.reduce((total, file) => total + file.additions, 0);
  const deletions = files.reduce((total, file) => total + file.deletions, 0);

  return (
    <Panel
      id="files"
      title={
        <>
          Changed files
          <Count value={files.length} />
        </>
      }
      actions={
        files.length > 0 && (
          <span className="text-[13px] tabular-nums">
            <span className="text-emerald-400">+{additions}</span>{" "}
            <span className="text-red-400">−{deletions}</span>
          </span>
        )
      }
    >
      {files.length === 0 ? (
        <EmptyState
          bare
          title="No changed files"
          description="GitHub didn't return any changed files for this pull request."
        />
      ) : (
        <ul className="divide-y divide-line">
          {files.map((file) => (
            <ChangedFileRow
              key={file.filename}
              file={file}
              findings={findingsByFile.get(file.filename) ?? 0}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ChangedFileRow({
  file,
  findings,
}: {
  file: GitHubFile;
  findings: number;
}) {
  const status = fileStatusStyles[file.status] ?? defaultFileStatus;
  const slash = file.filename.lastIndexOf("/");
  const directory = slash >= 0 ? file.filename.slice(0, slash + 1) : "";
  const basename = file.filename.slice(slash + 1);

  return (
    <li id={fileAnchorId(file.filename)} className="scroll-mt-6">
      <details className="group" open={findings > 0 && Boolean(file.patch)}>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 group-open:bg-surface-2 sm:px-5 [&::-webkit-details-marker]:hidden">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 shrink-0 text-ink-faint transition-transform group-open:rotate-90"
          >
            <path d="m6 4 4 4-4 4" />
          </svg>

          <span
            title={file.status}
            className={`w-3 shrink-0 text-center text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>

          <span className="min-w-0 flex-1 truncate font-mono text-[12.5px]" title={file.filename}>
            <span className="text-ink-faint">{directory}</span>
            <span className="font-medium text-ink">{basename}</span>
          </span>

          {findings > 0 && (
            <span className="shrink-0 text-xs font-semibold text-accent">
              {pluralize(findings, "finding")}
            </span>
          )}

          <span className="hidden shrink-0 items-center gap-2 text-[12.5px] tabular-nums sm:flex">
            <span className="text-emerald-400">+{file.additions}</span>
            <span className="text-red-400">−{file.deletions}</span>
            <DiffStat additions={file.additions} deletions={file.deletions} />
          </span>
        </summary>

        <div className="border-t border-line bg-surface-2 px-4 py-3 sm:px-5">
          {file.patch ? (
            <DiffView patch={file.patch} />
          ) : (
            <p className="text-xs text-ink-muted">
              Diff not available. The file may be binary or too large to display.
            </p>
          )}
        </div>
      </details>
    </li>
  );
}

function DiffStat({
  additions,
  deletions,
}: {
  additions: number;
  deletions: number;
}) {
  const total = additions + deletions;
  const blocks = 5;
  const added = total === 0 ? 0 : Math.round((additions / total) * blocks);
  const removed = total === 0 ? 0 : blocks - added;

  return (
    <span aria-hidden="true" className="flex gap-px">
      {Array.from({ length: blocks }, (_, index) => (
        <span
          key={index}
          className={`h-2 w-1.5 rounded-[1px] ${
            index < added
              ? "bg-emerald-400"
              : index < added + removed
                ? "bg-red-400"
                : "bg-surface-3"
          }`}
        />
      ))}
    </span>
  );
}

type DiffLine = {
  kind: "hunk" | "add" | "remove" | "context";
  content: string;
  oldLine: number | null;
  newLine: number | null;
};

function parsePatch(patch: string): DiffLine[] {
  let oldLine = 0;
  let newLine = 0;

  return patch.split("\n").map((content) => {
    if (content.startsWith("@@")) {
      const match = content.match(/-(\d+)(?:,\d+)? \+(\d+)/);

      if (match) {
        oldLine = Number(match[1]);
        newLine = Number(match[2]);
      }

      return { kind: "hunk", content, oldLine: null, newLine: null };
    }

    if (content.startsWith("+")) {
      return { kind: "add", content, oldLine: null, newLine: newLine++ };
    }

    if (content.startsWith("-")) {
      return { kind: "remove", content, oldLine: oldLine++, newLine: null };
    }

    if (content.startsWith("\\")) {
      // "\ No newline at end of file"
      return { kind: "context", content, oldLine: null, newLine: null };
    }

    return { kind: "context", content, oldLine: oldLine++, newLine: newLine++ };
  });
}

const diffLineStyles: Record<DiffLine["kind"], string> = {
  hunk: "bg-surface-3 text-ink-muted",
  add: "bg-emerald-400/10 text-emerald-200",
  remove: "bg-red-400/10 text-red-200",
  context: "text-ink-soft",
};

function DiffView({ patch }: { patch: string }) {
  const lines = parsePatch(patch);

  return (
    <div className="max-h-128 overflow-auto rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse font-mono text-xs leading-5">
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className={diffLineStyles[line.kind]}>
              <td className="w-10 select-none border-r border-line px-2 text-right text-[11px] text-ink-faint">
                {line.oldLine ?? ""}
              </td>
              <td className="w-10 select-none border-r border-line px-2 text-right text-[11px] text-ink-faint">
                {line.newLine ?? ""}
              </td>
              <td className="whitespace-pre px-3">{line.content || " "}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
