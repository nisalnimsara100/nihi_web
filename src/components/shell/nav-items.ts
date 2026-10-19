import {
  ArrowLeftRight,
  ChartColumn,
  House,
  Settings,
  Shapes,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/statistics", label: "Statistics", icon: ChartColumn },
  { href: "/accounts", label: "Wallet", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Shapes },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Pages reachable from the mobile "Profile" tab. */
export const MORE_ITEMS = NAV_ITEMS.filter((item) =>
  ["/transactions", "/categories", "/tags", "/settings"].includes(item.href),
);

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
