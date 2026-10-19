import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronRight, Receipt, Settings } from "lucide-react";
import { BalanceCard } from "@/components/finance/balance-card";
import { CategoryBars } from "@/components/finance/category-bars";
import { Greeting } from "@/components/finance/greeting";
import { TransactionList } from "@/components/finance/transaction-list";
import { Avatar } from "@/components/shell/user-menu";
import { ButtonLink, Card, CardHeader, ColorDot, EmptyState, IconLink, PageSkeleton, SeeAll } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { accountTypeLabel } from "@/lib/constants";
import { getAccounts, getCategoryBreakdown, getRecentTransactions, getTotalsByCurrency } from "@/lib/data";
import { currentMonthKey, formatMonth, monthRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Home" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

const ACTIONS = [
  { href: "/transactions/new?type=EXPENSE", label: "Expense", icon: ArrowUpRight },
  { href: "/transactions/new?type=INCOME", label: "Income", icon: ArrowDownLeft },
  { href: "/transactions/new?type=TRANSFER", label: "Transfer", icon: ArrowLeftRight },
];

async function Dashboard() {
  const user = await getCurrentUser();
  const month = currentMonthKey();
  const { start, end } = monthRange(month);
  const currency = user.defaultCurrency;

  const [accounts, totals, breakdown, recent] = await Promise.all([
    getAccounts(user.id),
    getTotalsByCurrency(user.id, start, end),
    getCategoryBreakdown(user.id, "EXPENSE", currency, start, end),
    getRecentTransactions(user.id, 6),
  ]);

  const netWorth = new Map<string, number>();
  for (const a of accounts) {
    netWorth.set(a.currency, (netWorth.get(a.currency) ?? 0) + a.balance);
  }
  const otherNetWorth = [...netWorth].filter(([c]) => c !== currency);
  const monthTotals = totals.find((t) => t.currency === currency) ?? { income: 0, expense: 0 };
  const net = monthTotals.income - monthTotals.expense;

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={user.name} className="size-11" />
          <div className="min-w-0">
            <p className="truncate text-xs text-ink-soft">Hi, {user.name.split(" ")[0]}</p>
            <p className="truncate text-lg font-bold">
              <Greeting />
            </p>
          </div>
        </div>
        <IconLink href="/settings" label="Settings">
          <Settings className="size-5" aria-hidden />
        </IconLink>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="min-w-0 space-y-4 lg:col-span-3">
          <BalanceCard
            label="Total Balance"
            amount={formatMoney(netWorth.get(currency) ?? 0, currency)}
            currency={currency}
            footer={
              <>
                {accounts.length} account{accounts.length === 1 ? "" : "s"}
                {otherNetWorth.length > 0 ? ` · ${otherNetWorth.map(([c, v]) => formatMoney(v, c)).join(" · ")}` : ""}
              </>
            }
          />

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {ACTIONS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-forest px-3 text-sm font-semibold text-on-forest transition-colors hover:bg-forest-soft"
              >
                <Icon className="size-4 shrink-0 text-lime" strokeWidth={2.6} aria-hidden />
                {label}
              </Link>
            ))}
          </div>

          <Link
            href="/statistics"
            className="flex items-center justify-between gap-4 rounded-3xl bg-forest px-5 py-4 text-on-forest transition-colors hover:bg-forest-soft"
          >
            <span className="min-w-0">
              <span className="block font-bold">
                {net >= 0 ? `You saved ${formatMoney(net, currency)}` : `Overspent by ${formatMoney(-net, currency)}`}
              </span>
              <span className="block truncate text-xs text-on-forest/70">
                {formatMonth(month)} · in {formatMoney(monthTotals.income, currency)} · out{" "}
                {formatMoney(monthTotals.expense, currency)}
              </span>
            </span>
            <ChevronRight className="size-6 shrink-0" aria-hidden />
          </Link>

          <section>
            <div className="mt-2 mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Transactions</h2>
              <SeeAll href="/transactions" />
            </div>
            {recent.length > 0 ? (
              <TransactionList transactions={recent} groupByDay={false} />
            ) : (
              <Card>
                <EmptyState
                  icon={<Receipt className="size-6" />}
                  title="No transactions yet"
                  description="Add your first expense or income to see it here."
                  action={<ButtonLink href="/transactions/new">Add transaction</ButtonLink>}
                />
              </Card>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Spending" action={<SeeAll href="/statistics">Details</SeeAll>} />
            <div className="p-5">
              {breakdown.length > 0 ? (
                <CategoryBars data={breakdown} currency={currency} limit={6} />
              ) : (
                <p className="text-sm text-ink-soft">No {currency} spending this month yet.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Wallet" action={<SeeAll href="/accounts" />} />
            <ul className="space-y-2 p-3">
              {accounts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/accounts/${a.id}`}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-muted"
                  >
                    <ColorDot color={a.color} className="size-3" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{a.name}</span>
                      <span className="block text-xs text-ink-soft">{accountTypeLabel(a.type)}</span>
                    </span>
                    <span className="text-sm font-bold tabular-nums">{formatMoney(a.balance, a.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
