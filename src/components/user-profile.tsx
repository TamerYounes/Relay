import { Avatar } from "./avatar";

export function UserProfile({ email }: { email?: string | null }) {
  return email ? (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar name={email} size={26} />
      <p className="min-w-0 truncate text-[13px] text-ink-soft" title={email}>
        {email}
      </p>
    </div>
  ) : (
    <span className="block h-3 w-28 rounded-sm bg-surface-3" />
  );
}
