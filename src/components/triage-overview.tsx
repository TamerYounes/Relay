type TriageCounts = {
  needsYou: number;
  waiting: number;
  reviewed: number;
};

/**
 * The three triage groups as tiles, each linking to its section of the list,
 * with a segmented bar showing how the open pull requests split.
 */
export function TriageOverview({ needsYou, waiting, reviewed }: TriageCounts) {
  const total = needsYou + waiting + reviewed;

  const tiles = [
    {
      id: "needs-you",
      label: "Needs you",
      short: "Needs you",
      value: needsYou,
      detail: "High or critical findings, or a failed review",
      className: needsYou > 0 ? "bg-accent/10" : "",
      bar: "bg-accent",
    },
    {
      id: "waiting",
      label: "Waiting for review",
      short: "Waiting",
      value: waiting,
      detail: "No review on the latest commit",
      className: "",
      bar: "bg-ink-faint",
    },
    {
      id: "reviewed",
      label: "Reviewed",
      short: "Reviewed",
      value: reviewed,
      detail: "Reviewed, nothing urgent",
      className: "",
      bar: "bg-emerald-400",
    },
  ];

  return (
    <section aria-label="Review overview" className="surface overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-line">
        {tiles.map((tile) => (
          <a
            key={tile.id}
            href={tile.value > 0 ? `#${tile.id}` : undefined}
            aria-disabled={tile.value === 0}
            className={`group block min-w-0 px-3.5 py-3.5 transition-colors sm:px-5 sm:py-4 ${tile.className} ${
              tile.value > 0 ? "hover:bg-surface-2" : "cursor-default"
            }`}
          >
            <p className="flex items-center gap-2 truncate text-[12.5px] font-medium text-ink-muted sm:text-[13px]">
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${tile.bar}`} />
              <span className="sm:hidden">{tile.short}</span>
              <span className="hidden sm:inline">{tile.label}</span>
            </p>
            <p className="mt-2 text-[28px] font-bold sm:text-[34px] leading-none tracking-[-0.03em] tabular-nums text-ink">
              {tile.value}
            </p>
            <p className="mt-2 hidden truncate text-[12.5px] text-ink-muted sm:block">
              {tile.detail}
            </p>
          </a>
        ))}
      </div>

      {total > 0 && (
        <div aria-hidden="true" className="flex h-1.5 gap-0.5 bg-surface-3">
          {tiles
            .filter((tile) => tile.value > 0)
            .map((tile) => (
              <span
                key={tile.id}
                className={tile.bar}
                style={{ flexGrow: tile.value }}
              />
            ))}
        </div>
      )}
    </section>
  );
}
