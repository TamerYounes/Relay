import { formatDateTime, formatRelativeTime } from "@/lib/format";

export function RelativeTime({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <time dateTime={value} title={formatDateTime(value)} className={className}>
      {formatRelativeTime(value)}
    </time>
  );
}
