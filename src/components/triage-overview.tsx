type TriageCounts = {
  needsYou: number;
  waiting: number;
  reviewed: number;
};

/** Jump links to the three triage groups, with their counts. */
export function TriageOverview({ needsYou, waiting, reviewed }: TriageCounts) {
  const links = [
    { id: "needs-you", label: "Needs you", value: needsYou, accent: true },
    { id: "waiting", label: "Waiting for review", value: waiting },
    { id: "reviewed", label: "Reviewed", value: reviewed },
  ];

  return (
    <nav
      aria-label="Jump to group"
      className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-3 text-[14px]"
    >
      {links.map((link) =>
        link.value > 0 ? (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="text-ink-muted transition-colors hover:text-ink"
          >
            {link.label}{" "}
            <span
              className={`font-semibold tabular-nums ${
                link.accent ? "text-accent" : "text-ink"
              }`}
            >
              {link.value}
            </span>
          </a>
        ) : (
          <span key={link.id} className="text-ink-faint">
            {link.label} <span className="tabular-nums">0</span>
          </span>
        ),
      )}
    </nav>
  );
}
