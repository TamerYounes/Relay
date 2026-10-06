"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Pull requests",
    isActive: (pathname: string) =>
      pathname === "/" || pathname.startsWith("/pull-requests"),
    icon: (
      <path d="M5 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm9 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 5v6m9 0V7a2 2 0 0 0-2-2H8m0 0 1.75-1.75M8 5l1.75 1.75" />
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    isActive: (pathname: string) => pathname.startsWith("/settings"),
    icon: (
      <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm5.2-2c0-.3 0-.6-.1-.9l1.4-1.1-1.3-2.3-1.7.6a5 5 0 0 0-1.5-.9L9.7 1.6H6.3L6 3.4a5 5 0 0 0-1.5.9l-1.7-.6L1.5 6l1.4 1.1a5 5 0 0 0 0 1.8L1.5 10l1.3 2.3 1.7-.6c.4.4 1 .7 1.5.9l.3 1.8h3.4l.3-1.8c.5-.2 1.1-.5 1.5-.9l1.7.6 1.3-2.3-1.4-1.1c.1-.3.1-.6.1-.9Z" />
    ),
  },
];

export function SidebarNav({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();
  const horizontal = orientation === "horizontal";

  return (
    <nav
      aria-label="Main"
      className={horizontal ? "flex gap-1" : "space-y-0.5"}
    >
      {navItems.map((item) => {
        const active = item.isActive(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              horizontal
                ? `-mb-px inline-flex items-center gap-2 border-b-2 px-2.5 py-2.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "border-signal text-white"
                      : "border-transparent text-ink-muted hover:text-zinc-200"
                  }`
                : `relative flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "bg-white/[0.07] text-white before:absolute before:inset-y-1.5 before:-left-3 before:w-0.5 before:bg-signal"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                  }`
            }
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 shrink-0 ${
                active ? "text-signal" : "text-ink-muted"
              }`}
            >
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
