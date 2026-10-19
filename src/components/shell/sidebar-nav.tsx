"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActive, NAV_ITEMS } from "./nav-items";

export function SidebarNav() {
  return <SidebarNavLinks pathname={usePathname()} />;
}

/** Static markup, also used as the Suspense fallback before the path is known. */
export function SidebarNavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-lime text-on-lime" : "text-on-forest/70 hover:bg-white/10 hover:text-on-forest",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
