"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, CircleUser, House, Plus, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { isActive, MORE_ITEMS } from "./nav-items";

const TABS = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/statistics", label: "Statistics", icon: ChartColumn },
  { href: "/transactions/new", label: "Add transaction", icon: Plus },
  { href: "/accounts", label: "Wallet", icon: Wallet },
  { href: "/more", label: "Profile", icon: CircleUser },
];

export function BottomNav() {
  return <BottomNavLinks pathname={usePathname()} />;
}

/** Static markup, also used as the Suspense fallback before the path is known. */
export function BottomNavLinks({ pathname }: { pathname: string }) {
  const activeHref =
    TABS.find((t) => t.href !== "/more" && isActive(pathname, t.href))?.href ??
    (isActive(pathname, "/more") || MORE_ITEMS.some((i) => isActive(pathname, i.href)) ? "/more" : undefined);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="mx-auto grid h-[68px] max-w-md grid-cols-5 items-center rounded-full bg-forest px-2 shadow-xl shadow-forest/25">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref;
          const isAdd = href === "/transactions/new";
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className="flex justify-center"
            >
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full transition-colors",
                  active ? "bg-lime text-on-lime" : "text-on-forest/90",
                  isAdd && !active && "ring-2 ring-on-forest/90 size-9",
                )}
              >
                <Icon className={isAdd && !active ? "size-5" : "size-6"} strokeWidth={2.2} aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
