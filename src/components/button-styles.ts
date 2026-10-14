const base =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13.5px] font-medium transition-all active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0";

export const buttonStyles = {
  primary: `${base} bg-zinc-900 font-semibold text-white shadow-[0_1px_2px_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none`,
  secondary: `${base} bg-white text-zinc-900 shadow-(--shadow-card) hover:bg-zinc-50 hover:shadow-(--shadow-raised) disabled:opacity-50`,
  danger: `${base} bg-white text-red-700 shadow-[0_0_0_1px_rgb(220_38_38/0.3)] hover:bg-red-50 disabled:opacity-50`,
};
