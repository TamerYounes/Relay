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
    <article className="px-4 py-4 sm:px-5">
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

      <h3 className="mt-2 text-[15px] font-semibold leading-snug text-ink">
        {finding.title}
      </h3>

      <p className="mt-1.5 max-w-[68ch] text-[14px] leading-6 text-ink-soft">
        {finding.explanation}
      </p>

      {finding.code_snippet && (
        <pre className="mt-3 overflow-x-auto rounded-md border border-line bg-background px-3 py-2.5 font-mono text-[12.5px] leading-5 text-ink">
          <code>{finding.code_snippet}</code>
        </pre>
      )}

      {finding.suggestion && (
        <p className="mt-3 max-w-[68ch] text-[14px] leading-6 text-ink-soft">
          <span className="font-semibold text-ink">Fix: </span>
          {finding.suggestion}
        </p>
      )}
    </article>
  );
}
