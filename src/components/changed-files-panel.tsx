import type { ChangedFile } from "@/types/relay";

export function ChangedFilesPanel({
  files,
}: {
  files: ChangedFile[];
}) {
  const totalFindings = files.reduce(
    (total, file) => total + file.findings,
    0,
  );

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">
              Changed files
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Files included in this review
            </p>
          </div>

          <span className="font-mono text-xs text-zinc-400">
            {files.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {files.map((file) => (
          <div
            key={file.path}
            className="px-5 py-4 transition-colors hover:bg-zinc-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-xs font-medium text-zinc-800">
                  {file.path}
                </p>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400">
                  <span>{file.additions} additions</span>
                  <span>{file.deletions} deletions</span>
                </div>
              </div>

              {file.findings > 0 ? (
                <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-amber-700">
                  {file.findings}
                </span>
              ) : (
                <span className="shrink-0 font-mono text-[11px] text-zinc-300">
                  0
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-200 bg-zinc-50 px-5 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Total findings</span>
          <span className="font-mono font-medium text-zinc-800">
            {totalFindings}
          </span>
        </div>
      </div>
    </section>
  );
}