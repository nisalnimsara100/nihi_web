"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActive, NAV_ITEMS } from "./nav-items";
import { useT } from "@/lib/i18n/client";

export function SidebarNav() {
  return <SidebarNavLinks pathname={usePathname()} />;
}

/** Static markup, also used as the Suspense fallback before the path is known. */
export function SidebarNavLinks({ pathname }: { pathname: string }) {
  const t = useT();
  return (
    <nav aria-label={t("Main")} className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary-soft text-on-primary-soft" : "text-ink-soft hover:bg-muted hover:text-ink",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}
