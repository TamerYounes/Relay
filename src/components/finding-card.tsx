import { formatCategory } from "@/lib/format";
import type { Finding } from "@/types/relay";
import { SeverityBadge } from "./severity-badge";

export function FindingCard({ finding }: { finding: Finding }) {
  return (
    <article className="p-3 md:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <span className="rounded-sm border border-zinc-300 bg-white px-1.5 py-0.5 text-xs font-medium text-zinc-700">
              {formatCategory(finding.category)}
            </span>
            <span className="rounded-sm border border-zinc-300 bg-white px-1.5 py-0.5 text-xs font-medium text-zinc-700">
              Confidence: {finding.confidence}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-zinc-950">
            {finding.title}
          </h3>
        </div>
        <p className="font-mono text-xs text-zinc-500 sm:text-right">
          {finding.filePath}:{finding.line}
        </p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h4 className="text-sm font-semibold text-zinc-950">Why it matters</h4>
          <p className="mt-1.5 text-sm leading-5 text-zinc-600">{finding.explanation}</p>
          <h4 className="mt-4 text-sm font-semibold text-zinc-950">Suggested fix</h4>
          <p className="mt-1.5 text-sm leading-5 text-zinc-600">{finding.suggestion}</p>
        </div>
        <pre className="overflow-x-auto border border-zinc-200 bg-zinc-50 p-3 text-xs leading-5 text-zinc-800">
          <code>{finding.codeSnippet}</code>
        </pre>
      </div>
    </article>
  );
}
