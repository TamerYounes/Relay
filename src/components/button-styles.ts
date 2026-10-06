const base =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-sm px-3 text-[13px] font-medium transition-colors active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0";

export const buttonStyles = {
  primary: `${base} bg-zinc-900 text-white shadow-[inset_0_-1px_0_rgb(0_0_0/0.4)] hover:bg-zinc-700 disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none`,
  secondary: `${base} border border-zinc-300 bg-white text-zinc-800 shadow-[0_1px_0_rgb(0_0_0/0.04)] hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-50`,
  danger: `${base} border border-red-300 bg-white text-red-700 hover:border-red-400 hover:bg-red-50 disabled:opacity-50`,
};
