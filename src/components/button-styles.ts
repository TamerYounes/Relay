const base =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13.5px] font-medium transition-all active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0";

export const buttonStyles = {
  primary: `${base} bg-accent font-semibold text-background shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] hover:bg-accent-strong disabled:bg-surface-3 disabled:text-ink-faint disabled:shadow-none`,
  secondary: `${base} bg-surface-2 text-ink shadow-(--shadow-card) hover:bg-surface-3 disabled:opacity-50`,
  danger: `${base} bg-surface-2 text-red-300 shadow-[0_0_0_1px_rgb(248_113_113/0.35)] hover:bg-red-500/10 disabled:opacity-50`,
};
