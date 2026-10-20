import {
  type AppIcon,
  ArrowsLeftRight,
  ChartBar,
  GearSix,
  House,
  Repeat,
  Shapes,
  Tag,
  Target,
  Wallet,
} from "@/components/icons";

export type NavItem = { href: string; label: string; icon: AppIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/transactions", label: "Transactions", icon: ArrowsLeftRight },
  { href: "/statistics", label: "Statistics", icon: ChartBar },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/accounts", label: "Wallet", icon: Wallet },
  { href: "/recurring", label: "Repeats", icon: Repeat },
  { href: "/categories", label: "Categories", icon: Shapes },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/settings", label: "Settings", icon: GearSix },
];

/** Pages reachable from the mobile "Profile" tab. */
export const MORE_ITEMS = NAV_ITEMS.filter((item) =>
  ["/transactions", "/budgets", "/recurring", "/categories", "/tags", "/settings"].includes(item.href),
);

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
