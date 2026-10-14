"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PullRequestIcon, SettingsIcon } from "./icons";

const navItems = [
  {
    href: "/",
    label: "Pull requests",
    Icon: PullRequestIcon,
    isActive: (pathname: string) =>
      pathname === "/" || pathname.startsWith("/pull-requests"),
  },
  {
    href: "/settings",
    label: "Settings",
    Icon: SettingsIcon,
    isActive: (pathname: string) => pathname.startsWith("/settings"),
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
    <nav aria-label="Main" className={horizontal ? "flex gap-1" : "space-y-0.5"}>
      {navItems.map((item) => {
        const active = item.isActive(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              horizontal
                ? `-mb-px inline-flex items-center gap-2 border-b-2 px-2.5 py-2.5 text-[13.5px] font-medium transition-colors ${
                    active
                      ? "border-zinc-900 text-zinc-900"
                      : "border-transparent text-zinc-600 hover:text-zinc-900"
                  }`
                : `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] transition-colors ${
                    active
                      ? "bg-zinc-100 font-semibold text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`
            }
          >
            <item.Icon
              className={`h-4 w-4 ${active ? "text-zinc-900" : "text-zinc-400"}`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
