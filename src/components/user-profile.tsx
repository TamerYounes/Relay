export function UserProfile({ email }: { email?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-ink-line bg-ink-raised font-mono text-[11px] font-semibold text-zinc-200"
      >
        {email ? email.charAt(0).toUpperCase() : ""}
      </span>

      <div className="min-w-0">
        {email ? (
          <p className="truncate text-xs text-zinc-300" title={email}>
            {email}
          </p>
        ) : (
          <span className="block h-3 w-28 rounded-xs bg-ink-line" />
        )}
      </div>
    </div>
  );
}
