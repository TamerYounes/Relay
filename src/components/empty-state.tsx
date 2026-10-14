import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  /** Render without its own border, for use inside an existing panel. */
  bare?: boolean;
};

export function EmptyState({
  title,
  description,
  action,
  tone = "neutral",
  bare = false,
}: EmptyStateProps) {
  const danger = tone === "danger";

  return (
    <div
      className={`px-5 py-8 sm:px-6 ${
        bare ? "" : "surface"
      }`}
      role={danger ? "alert" : undefined}
    >
      <p
        className={`text-[16px] font-semibold ${
          danger ? "text-red-300" : "text-ink"
        }`}
      >
        {title}
      </p>

      {description && (
        <div className="mt-1.5 max-w-xl text-[14px] leading-6 text-ink-muted">
          {description}
        </div>
      )}

      {action && (
        <div className="mt-5 flex flex-wrap items-center gap-2">{action}</div>
      )}
    </div>
  );
}
