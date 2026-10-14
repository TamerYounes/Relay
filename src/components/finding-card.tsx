import { fileAnchorId } from "@/lib/format";
import type { ReviewFinding } from "@/types/relay";
import { SeverityBadge } from "./severity-badge";

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
    "min-w-0 truncate font-mono text-xs text-ink-muted sm:ml-auto";

  return (
    <article className="px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <SeverityBadge severity={finding.severity} />

        {finding.category && (
          <span className="text-[13px] text-ink-muted">{finding.category}</span>
        )}

        {linkToFile ? (
          <a
            href={`#${fileAnchorId(finding.file_path)}`}
            className={`${locationClassName} underline decoration-line-strong underline-offset-2 hover:text-ink hover:decoration-ink`}
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

      <h3 className="mt-2.5 text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
        {finding.title}
      </h3>

      <p className="mt-1.5 max-w-[68ch] text-[14px] leading-6 text-ink-soft">
        {finding.explanation}
      </p>

      {finding.code_snippet && (
        <div className="mt-3.5 overflow-hidden rounded-xl bg-background ring-1 ring-line">
          <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2 font-mono text-[11.5px] text-ink-faint">
            <span className="truncate">{finding.file_path}</span>
            {finding.line !== null && <span className="shrink-0">line {finding.line}</span>}
          </div>
          <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-5 text-ink">
            <code>{finding.code_snippet}</code>
          </pre>
        </div>
      )}

      {finding.suggestion && (
        <div className="mt-3.5 max-w-[72ch] rounded-xl bg-emerald-400/8 px-3.5 py-2.5 text-[14px] leading-6 text-ink-soft ring-1 ring-inset ring-emerald-400/20">
          <span className="font-semibold text-emerald-300">Suggested fix: </span>
          {finding.suggestion}
        </div>
      )}
    </article>
  );
}
