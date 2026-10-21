import {
  ArrowDownLeft,
  ArrowsLeftRight,
  ArrowUpRight,
  Basket,
  Briefcase,
  CaretRight,
  ChartBar,
  Coffee,
  GearSix,
  House,
  Invoice,
  Lightning,
  Money,
  Plus,
  TrendUp,
  UserCircle,
  Wallet,
} from "@/components/icons";
import { MockAvatar } from "@/components/landing/mock-avatar";
import { MockProfileDock } from "@/components/landing/mock-profile-dock";
import { cn } from "@/lib/cn";

const ACTIONS = [
  { label: "Expense", icon: ArrowUpRight },
  { label: "Income", icon: ArrowDownLeft },
  { label: "Transfer", icon: ArrowsLeftRight },
  { label: "Wallet", icon: Wallet },
];

const TRANSACTIONS = [
  { icon: Basket, name: "Groceries", note: "Keells", amount: "-Rs. 4,280", tone: "text-expense", chip: "bg-warning-soft text-warning" },
  { icon: Briefcase, name: "Salary", note: "Bank transfer", amount: "+Rs. 250,000", tone: "text-income", chip: "bg-success-soft text-income" },
  { icon: Lightning, name: "Electricity", note: "CEB bill", amount: "-Rs. 6,940", tone: "text-expense", chip: "bg-primary-soft text-on-primary-soft" },
  { icon: Coffee, name: "Coffee", note: "Cash", amount: "-Rs. 850", tone: "text-expense", chip: "bg-danger-soft text-danger" },
];

const TABS = [
  { label: "Home", icon: House },
  { label: "Wallet", icon: Wallet },
  { label: "Add", icon: Plus },
  { label: "Stats", icon: ChartBar },
  { label: "Profile", icon: UserCircle },
];

const INSIGHTS = [
  { icon: Money, title: "Income", text: "Rs. 33,000 more than last month", tone: "bg-success-soft text-income" },
  { icon: Invoice, title: "Bills & Utilities", text: "2 bills fewer than last month", tone: "bg-primary-soft text-on-primary-soft" },
];

// Natural titanium edge, lit from the top left.
const TITANIUM = "linear-gradient(145deg, #9a9ca1 0%, #e4e5e8 16%, #6b6e74 42%, #c9cbcf 72%, #74777d 100%)";
const BUTTON = "linear-gradient(90deg, #6b6e74, #c9cbcf 50%, #6b6e74)";

/** Static picture of the NiHi home screen in an iPhone 15 Pro frame, with optional floating insight cards. */
export function PhoneMock({ className, insights = true }: { className?: string; insights?: boolean }) {
  return (
    <div aria-hidden className={cn("relative mx-auto w-full max-w-72.5 select-none", className)}>
      <div className="relative aspect-[71.6/147.6]">
        {/* Action button, volume up and down on the left; side button on the right. */}
        <span className="absolute top-[17%] -left-[3px] h-[5%] w-1 rounded-l-sm" style={{ background: BUTTON }} />
        <span className="absolute top-[25%] -left-[3px] h-[9%] w-1 rounded-l-sm" style={{ background: BUTTON }} />
        <span className="absolute top-[36%] -left-[3px] h-[9%] w-1 rounded-l-sm" style={{ background: BUTTON }} />
        <span className="absolute top-[29%] -right-[3px] h-[14%] w-1 rounded-r-sm" style={{ background: BUTTON }} />

        <div
          className="absolute inset-0 rounded-[54px] p-[3px] shadow-2xl shadow-primary/25"
          style={{ background: TITANIUM }}
        >
          <div className="h-full rounded-[51px] bg-black p-[7px] ring-1 ring-white/10">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[44px] bg-surface">
              <StatusBar />
              <div className="absolute top-[10px] left-1/2 z-20 h-[25px] w-[84px] -translate-x-1/2 rounded-full bg-black" />

              <div className="bg-hero rounded-b-[26px] px-4 pt-12 pb-4 text-white">
                <div className="flex items-center justify-between">
                  <MockAvatar />
                  <span className="text-center leading-tight">
                    <span className="block text-[9px] text-white/75">Good Day!</span>
                    <span className="block text-xs font-semibold">Nimal Perera</span>
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                    <GearSix className="size-4" />
                  </span>
                </div>
                <p className="mt-4 text-[9px] text-white/80">Total Balance</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums">Rs. 1,734,802</p>
                <p className="text-[9px] text-white/60">3 accounts</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] font-semibold">
                  <span className="flex items-center justify-center gap-1 rounded-lg bg-white/15 py-2 ring-1 ring-white/20">
                    <ArrowDownLeft className="size-3" /> Add Income
                  </span>
                  <span className="flex items-center justify-center gap-1 rounded-lg bg-white/15 py-2 ring-1 ring-white/20">
                    <ArrowUpRight className="size-3" /> Add Expense
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-3">
                <div className="flex items-center gap-2 rounded-xl bg-muted p-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-success-soft text-income">
                    <TrendUp className="size-4" />
                  </span>
                  <span className="text-[9px] leading-tight">
                    <span className="block font-semibold">You saved Rs. 156,962</span>
                    <span className="block text-ink-soft">This month</span>
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {ACTIONS.map(({ label, icon: Icon }) => (
                    <span key={label} className="flex flex-col items-center gap-1 rounded-xl bg-primary-soft py-2.5 text-on-primary-soft">
                      <Icon className="size-4" />
                      <span className="text-[8px] font-semibold">{label}</span>
                    </span>
                  ))}
                </div>
                <div>
                  <p className="mb-1.5 px-0.5 text-[10px] font-semibold">Recent</p>
                  <div className="space-y-2 rounded-xl bg-muted p-2.5">
                    {TRANSACTIONS.map(({ icon: Icon, name, note, amount, tone, chip }) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", chip)}>
                          <Icon className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block text-[9px] font-semibold">{name}</span>
                          <span className="block text-[8px] text-ink-soft">{note}</span>
                        </span>
                        <span className={cn("text-[9px] font-semibold tabular-nums", tone)}>{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <MockProfileDock open className="absolute bottom-[58px] left-2 z-10" />

              <div className="grid grid-cols-5 border-t border-line bg-surface px-2 pt-2 pb-6">
                {TABS.map(({ label, icon: Icon }, i) =>
                  label === "Add" ? (
                    <span key={label} className="flex items-center justify-center">
                      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-on-primary shadow-md shadow-primary/30">
                        <Icon className="size-4" strokeWidth={2.25} />
                      </span>
                    </span>
                  ) : (
                    <span
                      key={label}
                      className={cn(
                        "flex flex-col items-center gap-0.5 text-[7px] font-medium",
                        i === 0 ? "text-primary" : "text-ink-faint",
                      )}
                    >
                      <Icon className="size-4" strokeWidth={i === 0 ? 2.25 : 1.75} />
                      {label}
                    </span>
                  ),
                )}
              </div>
              <span className="absolute bottom-2 left-1/2 h-1 w-[36%] -translate-x-1/2 rounded-full bg-ink" />

              {/* Faint glare across the glass. */}
              <span className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/15 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {insights && (
        <div className="absolute top-[46%] -right-6 w-52 space-y-0.5 rounded-2xl bg-surface p-1.5 shadow-xl ring-1 ring-line/60 sm:-right-16">
          {INSIGHTS.map(({ icon: Icon, title, text, tone }) => (
            <div key={title} className="flex items-center gap-2 rounded-xl p-1.5">
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", tone)}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[10px] font-semibold text-ink">{title}</span>
                <span className="block truncate text-[9px] text-ink-soft">{text}</span>
              </span>
              <CaretRight className="size-3.5 text-ink-faint" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** iOS status bar: clock on the left, signal, Wi-Fi and battery on the right, either side of the Dynamic Island. */
function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-[45px] items-center justify-between px-[26px] text-white">
      <span className="w-[54px] text-center text-[12px] font-semibold tracking-tight">9:41</span>
      <span className="flex items-center gap-[5px]">
        <svg viewBox="0 0 18 12" className="h-[9px] w-auto" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12" className="h-[9px] w-auto" fill="currentColor">
          <path d="M8 2.4c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .6C5.2.6 2.7 1.7.8 3.5L2 4.8a8.6 8.6 0 0 1 6-2.4Z" />
          <path d="M8 5.9c1.4 0 2.6.5 3.6 1.4l1.2-1.3A7 7 0 0 0 8 4.1 7 7 0 0 0 3.2 6l1.2 1.3c1-.9 2.2-1.4 3.6-1.4Z" />
          <path d="M8 9.3c.5 0 1 .2 1.3.5L8 11.4 6.7 9.8c.3-.3.8-.5 1.3-.5Z" />
        </svg>
        <svg viewBox="0 0 27 13" className="h-[10px] w-auto">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor" />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}
