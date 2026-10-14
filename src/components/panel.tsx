import type { ReactNode } from "react";

type PanelProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
};

/** A titled section: heading outside, content in a white box. */
export function Panel({
  title,
  description,
  actions,
  children,
  id,
  className = "",
}: PanelProps) {
  return (
    <section id={id} className={`scroll-mt-6 space-y-3 ${className}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-0.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h2>

          {description && (
            <p className="text-[13px] text-ink-muted">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </header>

      <div className="surface overflow-hidden">
        {children}
      </div>
    </section>
  );
}

/** Count shown beside a panel title. */
export function Count({ value }: { value: number }) {
  return (
    <span className="ml-2 rounded-full bg-surface-3 px-2 align-[1px] text-[12px] font-semibold tabular-nums leading-5 text-ink-soft">
      {value}
    </span>
  );
}
