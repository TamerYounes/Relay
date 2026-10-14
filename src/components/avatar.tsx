const tints = [
  "bg-sky-100 text-sky-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
  "bg-orange-100 text-orange-800",
];

/** GitHub avatar, or initials on a stable tint when there's no image. */
export function Avatar({
  name,
  src,
  size = 28,
}: {
  name: string;
  src?: string | null;
  size?: number;
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
        className="shrink-0 rounded-full bg-zinc-100 ring-1 ring-black/5"
      />
    );
  }

  const tint =
    tints[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % tints.length];

  return (
    <span
      aria-hidden="true"
      style={{ ...style, fontSize: size * 0.42 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ${tint}`}
    >
      {name.charAt(0)}
    </span>
  );
}
