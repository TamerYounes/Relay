type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "warning" | "danger";
  /** Optional proportion meter, e.g. reviewed out of open. */
  meter?: { value: number; max: number };
};

const toneStyles: Record<
  NonNullable<MetricCardProps["tone"]>,
  { value: string; rule: string }
> = {
  neutral: { value: "text-zinc-950", rule: "bg-transparent" },
  warning: { value: "text-amber-700", rule: "bg-amber-400" },
  danger: { value: "text-red-700", rule: "bg-red-600" },
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  meter,
}: MetricCardProps) {
  const styles = toneStyles[tone];
  const ratio = meter && meter.max > 0 ? meter.value / meter.max : 0;

  return (
    <div className="relative bg-white px-4 pb-3.5 pt-4 sm:px-5">
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-0.5 ${styles.rule}`} />

      <p className="eyebrow text-zinc-500">{label}</p>

      <p
        className={`mt-2 font-mono text-[28px] font-medium leading-none tabular-nums tracking-tight ${styles.value}`}
      >
        {value}
      </p>

      {meter && (
        <div
          role="meter"
          aria-label={label}
          aria-valuenow={meter.value}
          aria-valuemin={0}
          aria-valuemax={meter.max}
          className="mt-3 h-1 overflow-hidden bg-zinc-100"
        >
          <div className="h-full bg-zinc-900" style={{ width: `${ratio * 100}%` }} />
        </div>
      )}

      <p
        className={`truncate text-xs text-zinc-500 ${meter ? "mt-2" : "mt-3"}`}
        title={detail}
      >
        {detail}
      </p>
    </div>
  );
}
