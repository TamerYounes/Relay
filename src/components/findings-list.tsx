import type { Finding } from "@/types/relay";
import { SeverityBadge } from "./severity-badge";

export function FindingsList({ findings }: { findings: Finding[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">
              Review findings
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Issues identified during the review
            </p>
          </div>

          <span className="font-mono text-xs text-zinc-400">
            {findings.length}
          </span>
        </div>
      </div>

      {findings.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-medium text-zinc-800">
            No findings
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            No issues were identified in this review.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200">
          {findings.map((finding, index) => (
            <article
              key={finding.id ?? `${finding.filePath}-${finding.line}-${index}`}
              className="p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={finding.severity} />

                <span className="font-mono text-[11px] text-zinc-400">
                  {finding.filePath}:{finding.line}
                </span>

                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                  {finding.category.replace("_", " ")}
                </span>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-zinc-950">
                {finding.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {finding.explanation}
              </p>

              {finding.codeSnippet && (
                <pre className="mt-4 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-950 p-4 font-mono text-xs leading-6 text-zinc-200">
                  <code>{finding.codeSnippet}</code>
                </pre>
              )}

              {finding.suggestion && (
                <div className="mt-4 border-l-2 border-zinc-200 pl-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Suggestion
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    {finding.suggestion}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}