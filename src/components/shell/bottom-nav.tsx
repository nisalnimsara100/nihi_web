"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBar, House, Plus, UserCircle, Wallet } from "@/components/icons";
import { cn } from "@/lib/cn";
import { isActive, MORE_ITEMS } from "./nav-items";

const TABS = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/accounts", label: "Wallet", icon: Wallet },
  { href: "/transactions/new", label: "Add", icon: Plus },
  { href: "/statistics", label: "Stats", icon: ChartBar },
  { href: "/more", label: "Profile", icon: UserCircle },
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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref;
          const isAdd = href === "/transactions/new";
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium",
                active ? "text-primary" : "text-ink-faint",
              )}
            >
              {isAdd ? (
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md shadow-primary/30">
                  <Icon className="size-5" weight="bold" aria-hidden />
                </span>
              ) : (
                <Icon className="size-6" weight={active ? "fill" : "duotone"} aria-hidden />
              )}
              {isAdd ? <span className="sr-only">{label}</span> : label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
