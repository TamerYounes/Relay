import type { ReactNode } from "react";

type PanelProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
};

export function Panel({
  title,
  description,
  actions,
  children,
  id,
  className = "",
}: PanelProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-6 overflow-hidden rounded border border-zinc-200 bg-white ${className}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-zinc-950">{title}</h2>

          {description && (
            <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </header>

      {children}
    </section>
  );
}

/** Small mono count shown beside a panel title. */
export function Count({ value }: { value: number }) {
  return (
    <span className="ml-1.5 font-mono text-xs font-normal tabular-nums text-zinc-400">
      {value}
    </span>
  );
}
