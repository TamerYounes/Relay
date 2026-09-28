type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <section className="border-r border-zinc-200 px-5 py-5 last:border-r-0">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium text-zinc-500">{label}</p>

        <span className="h-2 w-2 rounded-full bg-zinc-300" />
      </div>

      <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>

      <p className="mt-2 text-xs text-zinc-400">{detail}</p>
    </section>
  );
}