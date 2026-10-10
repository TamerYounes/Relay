import { formatDuration, STALE_AFTER_DAYS, type ReviewStats } from "@/lib/stats";
import { pluralize } from "@/lib/format";

export function ReviewActivity({ stats }: { stats: ReviewStats | null }) {
  return (
    <section
      aria-label="Review activity"
      className="flex flex-col gap-x-6 gap-y-2 rounded border border-zinc-200 bg-white px-4 py-3 text-[13px] sm:flex-row sm:items-center sm:px-5"
    >
      <p className="eyebrow shrink-0 text-zinc-500">Last 30 days</p>

      {stats ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-1.5">
          <Stat
            label="Median time to first review"
            value={
              stats.medianFirstReviewMs === null
                ? "No reviews yet"
                : formatDuration(stats.medianFirstReviewMs)
            }
            title={
              stats.medianFirstReviewMs === null
                ? undefined
                : `Across ${pluralize(stats.reviewedSampleSize, "reviewed PR")}`
            }
          />

          <Stat
            label={`Waiting ${STALE_AFTER_DAYS}+ days`}
            value={String(stats.waitingCount)}
            tone={stats.waitingCount > 0 ? "warning" : "neutral"}
          />

          <Stat label="Merged this week" value={String(stats.mergedThisWeek)} />
        </dl>
      ) : (
        <p className="text-xs text-zinc-500">
          Stats show up once Relay has synced this repository&apos;s pull
          request history.
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  title,
  tone = "neutral",
}: {
  label: string;
  value: string;
  title?: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div className="flex items-baseline gap-2" title={title}>
      <dt className="text-zinc-500">{label}</dt>
      <dd
        className={`font-mono font-medium tabular-nums ${
          tone === "warning" ? "text-amber-700" : "text-zinc-950"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
