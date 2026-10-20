import {
  ArrowRight,
  Banknote,
  Car,
  Coffee,
  CreditCard,
  Landmark,
  PiggyBank,
  Plane,
  Search,
  ShoppingCart,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react";

// Small static product pictures for the landing page feature cards.
// Colors come from the app's category palette (COLORS in lib/constants).

const ACCOUNTS = [
  { icon: Banknote, color: "#1baf7a", name: "Cash", amount: "Rs. 18,450" },
  { icon: Landmark, color: "#2a78d6", name: "Commercial Bank", amount: "Rs. 1,482,300" },
  { icon: PiggyBank, color: "#6250d6", name: "Fixed savings", amount: "Rs. 1,250,000" },
  { icon: CreditCard, color: "#e34948", name: "Credit card", amount: "-Rs. 15,948" },
];

export function AccountsVisual() {
  return (
    <div aria-hidden className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line/70">
      <p className="text-xs text-ink-soft">Net worth</p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">Rs. 2,734,802</p>
      <div className="mt-4 space-y-2.5">
        {ACCOUNTS.map(({ icon: Icon, color, name, amount }) => (
          <div key={name} className="flex items-center gap-2.5 text-sm">
            <span className="flex size-8 items-center justify-center rounded-xl bg-muted">
              <Icon className="size-4" style={{ color }} />
            </span>
            <span className="flex-1 truncate font-medium">{name}</span>
            <span className="font-semibold tabular-nums">{amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Income and expense per month, in thousands of rupees.
const MONTHS = [
  { month: "May", income: 252, expense: 141 },
  { month: "Jun", income: 250, expense: 168 },
  { month: "Jul", income: 268, expense: 122 },
  { month: "Aug", income: 250, expense: 189 },
  { month: "Sep", income: 283, expense: 131 },
  { month: "Oct", income: 250, expense: 93 },
];

export function StatsVisual() {
  const max = Math.max(...MONTHS.map((m) => m.income));
  return (
    <div aria-hidden className="grid gap-3 sm:grid-cols-[1fr_11rem]">
      <div className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line/70">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Income vs expense</p>
          <span className="flex gap-3 text-[11px] text-ink-soft">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-(--chart-income)" /> Income
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-(--chart-expense)" /> Expense
            </span>
          </span>
        </div>
        <div className="mt-4 flex h-32 items-end justify-between gap-2 border-b border-line">
          {MONTHS.map(({ month, income, expense }) => (
            <div key={month} className="flex h-full flex-1 items-end justify-center gap-1">
              <span className="w-2.5 rounded-t-sm bg-(--chart-income)" style={{ height: `${(income / max) * 100}%` }} />
              <span className="w-2.5 rounded-t-sm bg-(--chart-expense)" style={{ height: `${(expense / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between gap-2 text-[11px] text-ink-soft">
          {MONTHS.map(({ month }) => (
            <span key={month} className="flex-1 text-center">
              {month}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
        <div className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line/70">
          <p className="text-xs text-ink-soft">Saved in October</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">Rs. 156,962</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-income">
            <TrendingUp className="size-3" /> 63% of income
          </span>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line/70">
          <p className="text-xs text-ink-soft">Top category</p>
          <p className="mt-1 text-lg font-semibold">Food</p>
          <span className="mt-2 inline-flex rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-on-primary-soft">
            34% of spending
          </span>
        </div>
      </div>
    </div>
  );
}

export function TransferVisual() {
  return (
    <div aria-hidden className="space-y-2">
      <div className="flex items-center gap-2.5 rounded-2xl bg-surface p-3 shadow-sm ring-1 ring-line/70">
        <span className="flex size-9 items-center justify-center rounded-xl bg-muted">
          <PiggyBank className="size-4 text-[#6250d6]" />
        </span>
        <span className="flex-1 text-sm leading-tight">
          <span className="block font-semibold">Fixed savings</span>
          <span className="block text-xs text-ink-soft">LKR</span>
        </span>
        <span className="text-sm font-semibold text-expense tabular-nums">-Rs. 30,000</span>
      </div>
      <div className="flex justify-center">
        <span className="flex size-8 rotate-90 items-center justify-center rounded-full bg-primary text-on-primary shadow-md shadow-primary/30">
          <ArrowRight className="size-4" />
        </span>
      </div>
      <div className="flex items-center gap-2.5 rounded-2xl bg-surface p-3 shadow-sm ring-1 ring-line/70">
        <span className="flex size-9 items-center justify-center rounded-xl bg-muted">
          <Landmark className="size-4 text-[#2a78d6]" />
        </span>
        <span className="flex-1 text-sm leading-tight">
          <span className="block font-semibold">Travel card</span>
          <span className="block text-xs text-ink-soft">USD</span>
        </span>
        <span className="text-sm font-semibold text-income tabular-nums">+$99.80</span>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { icon: Utensils, color: "#eb6834", name: "Food" },
  { icon: ShoppingCart, color: "#eda100", name: "Groceries" },
  { icon: Car, color: "#2a78d6", name: "Transport" },
  { icon: Zap, color: "#6250d6", name: "Utilities" },
  { icon: Plane, color: "#1baf7a", name: "Travel" },
];

const TAGS = [
  { color: "#e87ba4", name: "family" },
  { color: "#008300", name: "work" },
  { color: "#2a78d6", name: "trip-ella" },
];

export function LabelsVisual() {
  return (
    <div aria-hidden className="flex flex-wrap justify-center gap-2">
      {CATEGORIES.map(({ icon: Icon, color, name }) => (
        <span
          key={name}
          className="flex items-center gap-1.5 rounded-full bg-surface py-1.5 pr-3 pl-1.5 text-sm font-medium shadow-sm ring-1 ring-line/70"
        >
          <span className="flex size-6 items-center justify-center rounded-full" style={{ background: `${color}1f` }}>
            <Icon className="size-3.5" style={{ color }} />
          </span>
          {name}
        </span>
      ))}
      {TAGS.map(({ color, name }) => (
        <span
          key={name}
          className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft shadow-sm ring-1 ring-line/70"
        >
          <span className="size-2 rounded-full" style={{ background: color }} />#{name}
        </span>
      ))}
    </div>
  );
}

export function SearchVisual() {
  return (
    <div aria-hidden className="space-y-2.5">
      <div className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm shadow-sm ring-1 ring-line/70">
        <Search className="size-4 text-ink-faint" />
        <span>coffee</span>
        <span className="h-4 w-px animate-pulse bg-primary" />
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
        {["October", "Expense", "Credit card"].map((f) => (
          <span key={f} className="rounded-full bg-primary-soft px-2.5 py-1 text-on-primary-soft">
            {f}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2.5 rounded-xl bg-surface p-2.5 shadow-sm ring-1 ring-line/70">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
          <Coffee className="size-4 text-[#e34948]" />
        </span>
        <span className="flex-1 text-sm leading-tight">
          <span className="block font-semibold">Coffee</span>
          <span className="block text-xs text-ink-soft">7 transactions</span>
        </span>
        <span className="text-sm font-semibold text-expense tabular-nums">-Rs. 5,950</span>
      </div>
    </div>
  );
}
