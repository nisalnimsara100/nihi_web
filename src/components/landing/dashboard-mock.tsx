import {
  type AppIcon,
  ArrowDownLeft,
  ArrowsLeftRight,
  ArrowUpRight,
  CaretRight,
  ChartBar,
  Coffee,
  CreditCard,
  Flag,
  ForkKnife,
  GearSix,
  House,
  Lightning,
  Lock,
  PiggyBank,
  Plus,
  Repeat,
  Shapes,
  ShoppingCart,
  Tag,
  Target,
  TrendUp,
  Wallet,
} from "@/components/icons";
import { MockAvatar } from "@/components/landing/mock-avatar";
import { MockProfileDock } from "@/components/landing/mock-profile-dock";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/cn";

const NAV: { label: string; icon: AppIcon }[] = [
  { label: "Home", icon: House },
  { label: "Transactions", icon: ArrowsLeftRight },
  { label: "Statistics", icon: ChartBar },
  { label: "Budgets", icon: Target },
  { label: "Wallet", icon: Wallet },
  { label: "Repeats", icon: Repeat },
  { label: "Goals", icon: Flag },
  { label: "Categories", icon: Shapes },
  { label: "Tags", icon: Tag },
  { label: "Settings", icon: GearSix },
];

const ACTIONS = [
  { label: "Expense", icon: ArrowUpRight },
  { label: "Income", icon: ArrowDownLeft },
  { label: "Transfer", icon: ArrowsLeftRight },
  { label: "Wallet", icon: Wallet },
];

const RECENT = [
  { icon: ShoppingCart, color: "#eda100", name: "Groceries", meta: "Today · Cash", amount: "-Rs. 4,280", income: false },
  { icon: Wallet, color: "#1baf7a", name: "Salary", meta: "Oct 25 · Bank", amount: "+Rs. 250,000", income: true },
  { icon: Lightning, color: "#2a78d6", name: "Electricity", meta: "Oct 24 · Bank", amount: "-Rs. 6,940", income: false },
  { icon: Coffee, color: "#e34948", name: "Coffee", meta: "Oct 23 · Card", amount: "-Rs. 850", income: false },
];

const SPENDING = [
  { icon: ForkKnife, color: "#eb6834", name: "Food & Dining", amount: "Rs. 38,420", share: 34 },
  { icon: House, color: "#6250d6", name: "Housing", amount: "Rs. 32,000", share: 28 },
  { icon: ShoppingCart, color: "#eda100", name: "Groceries", amount: "Rs. 21,150", share: 19 },
  { icon: Lightning, color: "#2a78d6", name: "Utilities", amount: "Rs. 12,870", share: 11 },
];

const ACCOUNTS = [
  { color: "#1baf7a", name: "Cash", type: "Cash", amount: "Rs. 18,450" },
  { color: "#2a78d6", name: "Commercial Bank", type: "Bank account", amount: "Rs. 1,482,300" },
  { color: "#6250d6", name: "Sampath Bank", type: "Bank account", amount: "Rs. 234,052" },
];

const BUDGETS = [
  { name: "Food & Dining", left: "Rs. 11,580 left", share: 77 },
  { name: "Groceries", left: "Rs. 8,850 left", share: 70 },
];

/** Static picture of the NiHi desktop dashboard inside a browser window. */
export function DashboardMock({ className, dockClassName }: { className?: string; dockClassName?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-2xl bg-surface text-ink shadow-2xl shadow-primary/15 ring-1 ring-line select-none",
        className,
      )}
    >
      <MockProfileDock open className={cn("absolute bottom-4 left-3 z-10 hidden md:flex", dockClassName)} />
      <div className="flex items-center gap-3 border-b border-line bg-muted/70 px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto flex w-1/3 min-w-40 items-center justify-center gap-1.5 rounded-md bg-surface py-1 text-[10px] text-ink-soft ring-1 ring-line">
          <Lock className="size-2.5" /> nihi / dashboard
        </span>
        <span className="w-10" />
      </div>

      <div className="flex">
        <aside className="hidden w-40 shrink-0 flex-col gap-3 border-r border-line p-3 md:flex">
          <span className="flex items-center gap-1.5 px-1">
            <LogoMark className="size-6" />
            <span className="text-sm font-bold tracking-tight">NiHi</span>
          </span>
          <span className="flex items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-[10px] font-semibold text-on-primary">
            <Plus className="size-3" /> New transaction
          </span>
          <nav className="space-y-0.5">
            {NAV.map(({ label, icon: Icon }, i) => (
              <span
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-medium",
                  i === 0 ? "bg-primary-soft text-on-primary-soft" : "text-ink-soft",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </span>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-3 p-3 sm:p-4">
          <div className="bg-hero rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <MockAvatar className="size-7" />
              <span className="text-center leading-tight">
                <span className="block text-[9px] text-white/75">Good Day!</span>
                <span className="block text-[11px] font-semibold">Nimal Perera</span>
              </span>
              <span className="flex size-7 items-center justify-center rounded-full bg-white/15">
                <GearSix className="size-3.5" />
              </span>
            </div>
            <p className="mt-3 text-[9px] text-white/80">Total Balance</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">Rs. 1,734,802</p>
            <p className="text-[9px] text-white/60">3 accounts</p>
            <p className="mt-1.5 flex gap-1.5 text-[8px] font-semibold">
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
                <PiggyBank className="size-2.5" /> Savings Rs. 1,250,000
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
                <CreditCard className="size-2.5" /> Cards owe Rs. 15,948
              </span>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-semibold">
              <span className="flex items-center justify-center gap-1 rounded-lg bg-white/15 py-2 ring-1 ring-white/20">
                <ArrowDownLeft className="size-3" /> Add Income
              </span>
              <span className="flex items-center justify-center gap-1 rounded-lg bg-white/15 py-2 ring-1 ring-white/20">
                <ArrowUpRight className="size-3" /> Add Expense
              </span>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-3">
              <div className="flex items-center gap-2 rounded-xl bg-muted p-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-success-soft text-income">
                  <TrendUp className="size-3.5" />
                </span>
                <span className="flex-1 text-[10px] leading-tight">
                  <span className="block font-semibold">You saved Rs. 156,962</span>
                  <span className="block text-ink-soft">October 2026</span>
                </span>
                <CaretRight className="size-3.5 text-ink-faint" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {ACTIONS.map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="flex flex-col items-center gap-1 rounded-xl bg-primary-soft py-2.5 text-on-primary-soft"
                  >
                    <Icon className="size-3.5" />
                    <span className="text-[9px] font-semibold">{label}</span>
                  </span>
                ))}
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="mb-2 text-[10px] font-semibold">Recent Transactions</p>
                <div className="space-y-2">
                  {RECENT.map(({ icon: Icon, color, name, meta, amount, income }) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-surface">
                        <Icon className="size-3.5" style={{ color }} />
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block text-[10px] font-semibold">{name}</span>
                        <span className="block text-[9px] text-ink-soft">{meta}</span>
                      </span>
                      <span className={cn("text-[10px] font-semibold tabular-nums", income ? "text-income" : "text-expense")}>
                        {amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden space-y-3 lg:col-span-2 lg:block">
              <div className="rounded-xl p-3 ring-1 ring-line">
                <p className="mb-2 text-[10px] font-semibold">Budgets</p>
                <div className="space-y-2">
                  {BUDGETS.map(({ name, left, share }) => (
                    <div key={name}>
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="font-medium">{name}</span>
                        <span className="font-semibold text-ink-soft">{left}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-3 ring-1 ring-line">
                <p className="mb-2 text-[10px] font-semibold">Spending this month</p>
                <div className="space-y-2">
                  {SPENDING.map(({ icon: Icon, color, name, amount, share }) => (
                    <div key={name}>
                      <div className="flex items-center gap-1.5 text-[9px]">
                        <Icon className="size-3" style={{ color }} />
                        <span className="flex-1 truncate font-medium">{name}</span>
                        <span className="font-semibold tabular-nums">{amount}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${share * 2.5}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-3 ring-1 ring-line">
                <p className="mb-2 text-[10px] font-semibold">Wallet</p>
                <div className="space-y-2">
                  {ACCOUNTS.map(({ color, name, type, amount }) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: color }} />
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[9px] font-semibold">{name}</span>
                        <span className="block text-[8px] text-ink-soft">{type}</span>
                      </span>
                      <span className="text-[9px] font-semibold tabular-nums">{amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
