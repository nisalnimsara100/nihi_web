import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ACTIONS = [
  { label: "Expense", icon: ArrowUpRight },
  { label: "Income", icon: ArrowDownLeft },
  { label: "Transfer", icon: ArrowLeftRight },
  { label: "Wallet", icon: Wallet },
];

const INSIGHTS = [
  { icon: Banknote, title: "Income", text: "Rs. 33,000 more than last month", tone: "bg-success-soft text-income" },
  { icon: ReceiptText, title: "Bills & Utilities", text: "2 bills fewer than last month", tone: "bg-primary-soft text-on-primary-soft" },
];

/** Static picture of the NiHi home screen in a phone frame, with floating insight cards. */
export function PhoneMock({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative mx-auto w-full max-w-72.5 select-none", className)}>
      <div className="relative overflow-hidden rounded-[44px] border-[7px] border-[#1b1c24] bg-surface shadow-2xl shadow-primary/20">
        <div className="absolute top-2 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#1b1c24]" />
        <div className="bg-hero rounded-b-[26px] px-4 pt-11 pb-4 text-white">
          <div className="flex items-center justify-between">
            <span className="size-8 rounded-full bg-white/25 ring-2 ring-white/30" />
            <span className="text-center leading-tight">
              <span className="block text-[9px] text-white/75">Good Day!</span>
              <span className="block text-xs font-semibold">Nimal Perera</span>
            </span>
            <span className="size-8 rounded-full bg-white/15" />
          </div>
          <p className="mt-4 text-[9px] text-white/80">Total Balance</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums">Rs. 1,250,800</p>
          <p className="text-[9px] text-white/60">4 accounts</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] font-semibold">
            <span className="flex items-center justify-center gap-1 rounded-lg bg-white/15 py-2 ring-1 ring-white/20">
              <ArrowDownLeft className="size-3" /> Add Income
            </span>
            <span className="flex items-center justify-center gap-1 rounded-lg bg-white/15 py-2 ring-1 ring-white/20">
              <ArrowUpRight className="size-3" /> Add Expense
            </span>
          </div>
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-muted p-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-success-soft text-income">
              <TrendingUp className="size-4" />
            </span>
            <span className="text-[9px] leading-tight">
              <span className="block font-semibold">You saved Rs. 156,962</span>
              <span className="block text-ink-soft">This month</span>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {ACTIONS.map(({ label, icon: Icon }) => (
              <span key={label} className="flex flex-col items-center gap-1 rounded-xl bg-primary-soft py-2.5 text-on-primary-soft">
                <Icon className="size-4" strokeWidth={1.8} />
                <span className="text-[8px] font-semibold">{label}</span>
              </span>
            ))}
          </div>
          <div className="space-y-2 rounded-xl bg-muted p-2.5">
            {[
              ["Groceries", "-Rs. 4,280", "text-expense"],
              ["Salary", "+Rs. 250,000", "text-income"],
            ].map(([name, amount, tone]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="size-7 rounded-lg bg-surface shadow-sm" />
                <span className="flex-1 text-[9px] font-semibold">{name}</span>
                <span className={cn("text-[9px] font-semibold tabular-nums", tone)}>{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-[52%] -right-6 w-52 space-y-0.5 rounded-2xl bg-surface p-1.5 shadow-xl ring-1 ring-line/60 sm:-right-16">
        {INSIGHTS.map(({ icon: Icon, title, text, tone }) => (
          <div key={title} className="flex items-center gap-2 rounded-xl p-1.5">
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", tone)}>
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[10px] font-semibold text-ink">{title}</span>
              <span className="block truncate text-[9px] text-ink-soft">{text}</span>
            </span>
            <ChevronRight className="size-3.5 text-ink-faint" />
          </div>
        ))}
      </div>
    </div>
  );
}
