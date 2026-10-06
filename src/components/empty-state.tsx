import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  /** Short mono label above the title. Defaults based on tone. */
  label?: string;
  /** Render without its own border, for use inside an existing panel. */
  bare?: boolean;
};

export function EmptyState({
  title,
  description,
  action,
  tone = "neutral",
  label,
  bare = false,
}: EmptyStateProps) {
  const danger = tone === "danger";

  return (
    <div
      className={`px-5 py-8 sm:px-6 ${
        bare
          ? ""
          : `rounded border bg-white ${
              danger ? "border-red-200 border-l-red-600 border-l-[3px]" : "border-zinc-200"
            }`
      }`}
      role={danger ? "alert" : undefined}
    >
      <p className={`eyebrow ${danger ? "text-red-700" : "text-zinc-400"}`}>
        {label ?? (danger ? "Error" : "Empty")}
      </p>

      <p className="mt-1.5 text-[15px] font-semibold text-zinc-950">{title}</p>

      {description && (
        <div className="mt-1 max-w-xl text-[13px] leading-5 text-zinc-600">
          {description}
        </div>
      )}

      {action && <div className="mt-4 flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
