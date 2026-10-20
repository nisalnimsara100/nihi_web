"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowsLeftRight, ChartBar, House, Plus, UserCircle, Wallet } from "@/components/icons";
import { cn } from "@/lib/cn";
import { isActive, MORE_ITEMS } from "./nav-items";

const TABS = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/accounts", label: "Wallet", icon: Wallet },
  { href: "/transactions/new", label: "Add", icon: Plus },
  { href: "/statistics", label: "Stats", icon: ChartBar },
  { href: "/more", label: "Profile", icon: UserCircle },
];

// Partners viewing someone else can't add anything, so Transactions takes the Add slot.
const READ_ONLY_TABS = TABS.map((tab) =>
  tab.href === "/transactions/new" ? { href: "/transactions", label: "Transactions", icon: ArrowsLeftRight } : tab,
);

export function BottomNav({ readOnly = false }: { readOnly?: boolean }) {
  return <BottomNavLinks pathname={usePathname()} readOnly={readOnly} />;
}

/** Static markup, also used as the Suspense fallback before the path is known. */
export function BottomNavLinks({ pathname, readOnly = false }: { pathname: string; readOnly?: boolean }) {
  const tabs = readOnly ? READ_ONLY_TABS : TABS;
  const activeHref =
    tabs.find((t) => t.href !== "/more" && isActive(pathname, t.href))?.href ??
    (isActive(pathname, "/more") || MORE_ITEMS.some((i) => isActive(pathname, i.href)) ? "/more" : undefined);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
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
                  <Icon className="size-5" strokeWidth={2.25} aria-hidden />
                </span>
              ) : (
                <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              )}
              {isAdd ? <span className="sr-only">{label}</span> : label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
