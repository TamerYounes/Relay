import { fileAnchorId, pluralize } from "@/lib/format";
import type { GitHubFile } from "@/types/relay";
import { EmptyState } from "./empty-state";
import { Count, Panel } from "./panel";

const fileStatusStyles: Record<string, { label: string; className: string }> = {
  added: { label: "A", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  removed: { label: "D", className: "border-red-200 bg-red-50 text-red-700" },
  modified: { label: "M", className: "border-amber-200 bg-amber-50 text-amber-700" },
  renamed: { label: "R", className: "border-blue-200 bg-blue-50 text-blue-700" },
  copied: { label: "C", className: "border-blue-200 bg-blue-50 text-blue-700" },
};

const defaultFileStatus = {
  label: "•",
  className: "border-zinc-200 bg-zinc-50 text-zinc-600",
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
          <span className="font-mono text-xs tabular-nums">
            <span className="text-emerald-600">+{additions}</span>{" "}
            <span className="text-red-600">−{deletions}</span>
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
        <ul className="divide-y divide-zinc-100">
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
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 transition-colors hover:row-cursor hover:bg-zinc-50 group-open:bg-zinc-50 sm:px-5 [&::-webkit-details-marker]:hidden">
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform group-open:rotate-90"
          >
            <path d="m6 4 4 4-4 4" />
          </svg>

          <span
            title={file.status}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border font-mono text-[10px] font-semibold ${status.className}`}
          >
            {status.label}
          </span>

          <span className="min-w-0 flex-1 truncate font-mono text-xs" title={file.filename}>
            <span className="text-zinc-400">{directory}</span>
            <span className="font-medium text-zinc-900">{basename}</span>
          </span>

          {findings > 0 && (
            <span className="shrink-0 rounded-xs border border-amber-300 bg-amber-50 px-1.5 font-mono text-[10.5px] font-medium leading-4 text-amber-800">
              {pluralize(findings, "finding")}
            </span>
          )}

          <span className="hidden shrink-0 items-center gap-2 font-mono text-[11px] tabular-nums sm:flex">
            <span className="text-emerald-600">+{file.additions}</span>
            <span className="text-red-600">−{file.deletions}</span>
            <DiffStat additions={file.additions} deletions={file.deletions} />
          </span>
        </summary>

        <div className="border-t border-zinc-200 px-4 py-3 sm:px-5">
          {file.patch ? (
            <DiffView patch={file.patch} />
          ) : (
            <p className="text-xs text-zinc-500">
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
          className={`h-2 w-1.5 ${
            index < added
              ? "bg-emerald-500"
              : index < added + removed
                ? "bg-red-500"
                : "bg-zinc-200"
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
  hunk: "bg-zinc-100 text-zinc-500",
  add: "bg-emerald-50 text-emerald-900",
  remove: "bg-red-50 text-red-900",
  context: "text-zinc-700",
};

function DiffView({ patch }: { patch: string }) {
  const lines = parsePatch(patch);

  return (
    <div className="max-h-128 overflow-auto rounded-sm border border-zinc-200 bg-white">
      <table className="w-full border-collapse font-mono text-xs leading-5">
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className={diffLineStyles[line.kind]}>
              <td className="w-10 select-none border-r border-zinc-100 px-2 text-right text-[11px] text-zinc-400">
                {line.oldLine ?? ""}
              </td>
              <td className="w-10 select-none border-r border-zinc-100 px-2 text-right text-[11px] text-zinc-400">
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
