import { fileAnchorId } from "@/lib/format";
import type { ReviewFinding } from "@/types/relay";
import { SeverityBadge, severityStyles } from "./severity-badge";

export function FindingCard({
  finding,
  linkToFile = false,
}: {
  finding: ReviewFinding;
  /** Link the file location to its entry in the changed files list. */
  linkToFile?: boolean;
}) {
  const location = `${finding.file_path}${
    finding.line !== null ? `:${finding.line}` : ""
  }`;

  const locationClassName =
    "min-w-0 truncate font-mono text-[11.5px] text-zinc-500 sm:ml-auto";

  return (
    <article
      className={`border-l-[3px] px-4 py-4 sm:px-5 ${severityStyles[finding.severity].border}`}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <SeverityBadge severity={finding.severity} />

        {finding.category && (
          <span className="eyebrow text-zinc-500">{finding.category}</span>
        )}

        {linkToFile ? (
          <a
            href={`#${fileAnchorId(finding.file_path)}`}
            className={`${locationClassName} underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-900`}
            title={`Jump to ${location}`}
          >
            {location}
          </a>
        ) : (
          <span className={locationClassName} title={location}>
            {location}
          </span>
        )}
      </div>

      <h3 className="mt-2.5 text-[15px] font-semibold leading-5 tracking-[-0.005em] text-zinc-950">
        {finding.title}
      </h3>

      <p className="mt-1.5 max-w-3xl text-[13.5px] leading-6 text-zinc-700">
        {finding.explanation}
      </p>

      {finding.code_snippet && (
        <div className="mt-3 overflow-hidden rounded-sm bg-ink">
          <div className="flex items-center justify-between gap-3 border-b border-ink-line px-3 py-1.5 font-mono text-[11px] text-ink-muted">
            <span className="truncate">{finding.file_path}</span>
            {finding.line !== null && (
              <span className="shrink-0 text-signal">L{finding.line}</span>
            )}
          </div>
          <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[12.5px] leading-5 text-zinc-100">
            <code>{finding.code_snippet}</code>
          </pre>
        </div>
      )}

      {finding.suggestion && (
        <div className="mt-3 max-w-3xl border-l-2 border-emerald-600 pl-3">
          <p className="eyebrow text-emerald-800">Suggested fix</p>
          <p className="mt-1 text-[13px] leading-5 text-zinc-700">
            {finding.suggestion}
          </p>
        </div>
      )}
    </article>
  );
}
