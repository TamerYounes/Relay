const tints = [
  "bg-[#24345a] text-[#b9cbf5]",
  "bg-[#3a2f55] text-[#d4c6f2]",
  "bg-[#1f4537] text-[#a9e6c8]",
  "bg-[#4a3524] text-[#f1cfa8]",
  "bg-[#462536] text-[#f0bfd5]",
  "bg-[#1f3f4a] text-[#a6dcec]",
];

/** GitHub avatar, or initials on a stable tint when there's no image. */
export function Avatar({
  name,
  src,
  size = 28,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  /** Extra classes, e.g. a status ring. */
  className?: string;
}) {
  const style = { width: size, height: size };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        style={style}
        className={`shrink-0 rounded-full bg-surface-3 ring-1 ring-white/10 ${className}`}
      />
    );
  }

  const tint =
    tints[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tints.length];

  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: size * 0.42 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ${tint} ${className}`}
    >
      {name.charAt(0)}
    </span>
  );
}
