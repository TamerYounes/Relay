export function PullRequestIcon({
  draft = false,
  className = "h-4 w-4",
}: {
  draft?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} ${draft ? "text-zinc-400" : "text-emerald-700"}`}
      role="img"
      aria-label={draft ? "Draft pull request" : "Open pull request"}
    >
      <circle cx="4" cy="3.5" r="1.75" />
      <circle cx="4" cy="12.5" r="1.75" />
      <circle cx="12" cy="12.5" r="1.75" />
      <path d="M4 5.25v5.5" />
      {draft ? (
        <path d="M12 5v.5M12 8v.5" />
      ) : (
        <path d="M12 10.75V6a2 2 0 0 0-2-2H7.5m0 0L9.25 2.25M7.5 4l1.75 1.75" />
      )}
    </svg>
  );
}
