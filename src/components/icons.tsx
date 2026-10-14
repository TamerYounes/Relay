import type { ReactNode } from "react";

function Icon({
  children,
  className = "h-4 w-4",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string };

export function PullRequestIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="4" cy="3.5" r="1.75" />
      <circle cx="4" cy="12.5" r="1.75" />
      <circle cx="12" cy="12.5" r="1.75" />
      <path d="M4 5.25v5.5M12 10.75V6a2 2 0 0 0-2-2H7.5m0 0L9.25 2.25M7.5 4l1.75 1.75" />
    </Icon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 4.5h7M12.5 4.5h1M2.5 11.5h1M6.5 11.5h7" />
      <circle cx="11" cy="4.5" r="1.5" />
      <circle cx="5" cy="11.5" r="1.5" />
    </Icon>
  );
}

export function BranchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="4.5" cy="3.5" r="1.5" />
      <circle cx="4.5" cy="12.5" r="1.5" />
      <circle cx="11.5" cy="5" r="1.5" />
      <path d="M4.5 5v6M11.5 6.5c0 3-3 3-7 4.5" />
    </Icon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 4 4 4-4 4" />
    </Icon>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.5 2.5h4v4M13.5 2.5 8 8M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3" />
    </Icon>
  );
}

/** Two offset arrows: work handed from one person to the next. */
export function RelayMark({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2.5 5.5h8m0 0-2.5-2.5m2.5 2.5L8 8M13.5 10.5h-8m0 0L8 8m-2.5 2.5L8 13" />
    </svg>
  );
}
