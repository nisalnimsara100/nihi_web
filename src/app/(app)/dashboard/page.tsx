import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowDownLeft,
  ArrowsLeftRight,
  ArrowUpRight,
  Bell,
  CaretRight,
  ChartBar,
  CreditCard,
  GearSix,
  PiggyBank,
  Receipt,
  SlidersHorizontal,
  TrendUp,
  Wallet,
  Warning,
} from "@/components/icons";
import { StatusBarTint } from "@/components/shell/status-bar-tint";
import { BalanceCard } from "@/components/finance/balance-card";
import { CategoryBars } from "@/components/finance/category-bars";
import { Greeting } from "@/components/finance/greeting";
import { TransactionList } from "@/components/finance/transaction-list";
import { Avatar } from "@/components/shell/user-menu";
import { ButtonLink, Card, CardHeader, ColorDot, EmptyState, MaybeLink, PageSkeleton, SeeAll } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { accountTypeLabel } from "@/lib/constants";
import { DueRecurring } from "@/components/finance/due-recurring";
import { buildAlerts } from "@/lib/alerts";
import { goalProgress } from "@/lib/goals";
import { budgetStatus, monthProgress } from "@/lib/budgets";
import { dueCount, type Frequency } from "@/lib/recurring";
import { getAccounts, getBudgetRows, getDueRecurring, getGoals, getMonthlyTrend, getUpcomingRecurring, getCategoryBreakdown, getRecentTransactions, getTotalsByCurrency } from "@/lib/data";
import { addDays, currentMonthKey, daysBetween, dueLabel, formatMonth, monthRange, shiftMonth, todayDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";

// The blue header reaches the top edge, so the phone's status bar takes its colour
// (the middle of the header gradient) instead of the white used elsewhere.
export const viewport: Viewport = { themeColor: "#5a5efc" };

export const metadata: Metadata = { title: "Home" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

const QUICK_ACTIONS = [
  { href: "/transactions/new?type=EXPENSE", label: "Expense", icon: ArrowUpRight },
  { href: "/transactions/new?type=INCOME", label: "Income", icon: ArrowDownLeft },
  { href: "/transactions/new?type=TRANSFER", label: "Transfer", icon: ArrowsLeftRight },
  { href: "/accounts", label: "Wallet", icon: Wallet },
];

const heroButton =
  "flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-primary-strong";

async function Dashboard() {
  const { owner: user, readOnly } = await getViewer();
  const month = currentMonthKey();
  const { start, end } = monthRange(month);
  const currency = user.defaultCurrency;

  const today = todayDay();
  const [accounts, totals, breakdown, recent, budgetRows, dueRules, upcoming, trend, goals] = await Promise.all([
    getAccounts(user.id),
    getTotalsByCurrency(user.id, start, end),
    getCategoryBreakdown(user.id, "EXPENSE", currency, start, end),
    getRecentTransactions(user.id, 6),
    getBudgetRows(user.id, currency, month),
    readOnly ? Promise.resolve([]) : getDueRecurring(user.id, today),
    readOnly ? Promise.resolve([]) : getUpcomingRecurring(user.id, today, addDays(today, 3)),
    getMonthlyTrend(user.id, currency, shiftMonth(month, -3), month),
    getGoals(user.id),
  ]);

  // Heads-up messages are for the owner; a partner only looks.
  const previous = trend.filter((m) => m.month !== month && m.expense > 0);
  const alerts = readOnly
    ? []
    : buildAlerts({
        budgets: budgetRows.filter((r) => r.limit !== null).map((r) => ({ id: r.category.id, name: r.category.name, spent: r.spent, limit: r.limit! })),
        upcoming: upcoming.map((r) => ({
          id: r.id,
          title: r.note || r.category?.name || "Repeating transaction",
          daysAway: daysBetween(today, r.nextDate),
          money: formatMoney(r.amount, r.account.currency),
        })),
        cards: accounts
          .filter((a) => a.type === "CREDIT_CARD" && a.creditLimit)
          .map((a) => ({ id: a.id, name: a.name, utilization: Math.max(0, -a.balance) / a.creditLimit! })),
        spendNow: trend.find((m) => m.month === month)?.expense ?? 0,
        spendAverage: previous.length ? previous.reduce((sum, m) => sum + m.expense, 0) / previous.length : 0,
        monthProgress: monthProgress(today),
        money: (minor) => formatMoney(minor, currency),
      });

  // The total balance is money you have. Credit cards are debt to a bank, so they stay out of it
  // and show on their own, small, under the total.
  // Savings are money set aside, so they are also kept out of the total and shown on their own.
  const ownAccounts = accounts.filter((a) => a.type !== "CREDIT_CARD" && a.type !== "SAVINGS");
  const savings = new Map<string, number>();
  for (const a of accounts) {
    if (a.type === "SAVINGS") savings.set(a.currency, (savings.get(a.currency) ?? 0) + a.balance);
  }
  const netWorth = new Map<string, number>();
  for (const a of ownAccounts) {
    netWorth.set(a.currency, (netWorth.get(a.currency) ?? 0) + a.balance);
  }
  const cardsOwed = new Map<string, number>();
  for (const a of accounts) {
    if (a.type === "CREDIT_CARD" && a.balance < 0) cardsOwed.set(a.currency, (cardsOwed.get(a.currency) ?? 0) - a.balance);
  }
  const otherNetWorth = [...netWorth].filter(([c]) => c !== currency);
  const monthTotals = totals.find((t) => t.currency === currency) ?? { income: 0, expense: 0 };
  const net = monthTotals.income - monthTotals.expense;
  const saved = net >= 0;

  return (
    <>
      {/* Full-bleed on phones, a rounded card from sm up. */}
      <StatusBarTint />
      <section className="bg-hero -mx-4 -mt-[max(1.25rem,env(safe-area-inset-top))] rounded-b-[32px] px-5 pt-[calc(max(1.25rem,env(safe-area-inset-top))+0.5rem)] pb-6 text-white shadow-xl shadow-primary/20 sm:mx-0 sm:mt-0 sm:rounded-[32px] sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <Avatar name={user.name} className="size-11 bg-white/20 text-white ring-2 ring-white/30" />
          <div className="min-w-0 text-center">
            <p className="text-sm text-white/75">
              <Greeting />
            </p>
            <p className="truncate text-lg font-semibold">{user.name}</p>
          </div>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex size-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20 hover:bg-white/25"
          >
            <GearSix className="size-5" aria-hidden />
          </Link>
        </div>

        <div className="mt-7">
          <BalanceCard
            label="Total Balance"
            amount={formatMoney(netWorth.get(currency) ?? 0, currency)}
            footer={
              <>
                {ownAccounts.length} account{ownAccounts.length === 1 ? "" : "s"}
                {otherNetWorth.length > 0 ? ` · ${otherNetWorth.map(([c, v]) => formatMoney(v, c)).join(" · ")}` : ""}
                {cardsOwed.size > 0 || savings.size > 0 ? (
                  <span className="mt-2 flex flex-wrap gap-2">
                    {savings.size > 0 ? (
                      <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                        <PiggyBank className="size-3.5" aria-hidden />
                        Savings {[...savings].map(([c, v]) => formatMoney(v, c)).join(" · ")}
                      </span>
                    ) : null}
                    {cardsOwed.size > 0 ? (
                      <span className="flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                        <CreditCard className="size-3.5" aria-hidden />
                        Cards owe {[...cardsOwed].map(([c, v]) => formatMoney(v, c)).join(" · ")}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </>
            }
          />
        </div>

        {readOnly ? null : (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/transactions/new?type=INCOME" className={heroButton}>
              <ArrowDownLeft className="size-5" aria-hidden />
              Add Income
            </Link>
            <Link href="/transactions/new?type=EXPENSE" className={heroButton}>
              <ArrowUpRight className="size-5" aria-hidden />
              Add Expense
            </Link>
          </div>
        )}
      </section>

      <div className="mt-5 grid items-start gap-5 lg:mt-6 lg:grid-cols-5">
        <div className="min-w-0 space-y-5 lg:col-span-3">
          <Link
            href="/statistics"
            className="flex items-center gap-4 rounded-3xl bg-muted p-4 transition-colors hover:bg-line"
          >
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                saved ? "bg-success-soft text-income" : "bg-warning-soft text-warning",
              )}
            >
              {saved ? <TrendUp className="size-6" aria-hidden /> : <Warning className="size-6" aria-hidden />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">
                {saved ? `You saved ${formatMoney(net, currency)}` : `Overspent by ${formatMoney(-net, currency)}`}
              </span>
              <span className="block truncate text-sm text-ink-soft">
                {formatMonth(month)} · in {formatMoney(monthTotals.income, currency)} · out{" "}
                {formatMoney(monthTotals.expense, currency)}
              </span>
            </span>
            <CaretRight className="size-5 shrink-0 text-ink-faint" aria-hidden />
          </Link>

          {readOnly ? null : (
          <section>
            <h2 className="mb-3 text-base font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl bg-primary-soft text-on-primary-soft transition-colors hover:bg-primary-soft-strong sm:aspect-auto sm:py-5"
                >
                  <Icon className="size-6" aria-hidden />
                  <span className="text-xs font-semibold sm:text-sm">{label}</span>
                </Link>
              ))}
            </div>
          </section>
          )}

          <section className="rounded-3xl bg-muted p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent Transactions</h2>
              <Link
                href="/transactions"
                aria-label="All transactions"
                className="flex size-10 items-center justify-center rounded-xl bg-surface text-ink shadow-sm hover:bg-line/50"
              >
                <SlidersHorizontal className="size-5" aria-hidden />
              </Link>
            </div>
            {recent.length > 0 ? (
              <TransactionList transactions={recent} groupByDay={false} readOnly={readOnly} />
            ) : (
              <EmptyState
                icon={<Receipt className="size-6" />}
                title="No transactions yet"
                description={readOnly ? "Nothing has been added yet." : "Add your first expense or income to see it here."}
                action={readOnly ? undefined : <ButtonLink href="/transactions/new">Add transaction</ButtonLink>}
              />
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-5 lg:col-span-2">
          {alerts.length > 0 ? (
            <Card>
              <CardHeader title="Heads-up" />
              <ul className="divide-y divide-line">
                {alerts.map((a) => (
                  <li key={a.id}>
                    <Link href={a.href} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted">
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl",
                          a.tone === "bad" ? "bg-danger-soft text-danger" : a.tone === "warn" ? "bg-warning-soft text-ink" : "bg-primary-soft text-on-primary-soft",
                        )}
                      >
                        <Bell className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{a.title}</span>
                        {a.detail ? <span className="block text-xs text-ink-soft">{a.detail}</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {dueRules.length > 0 ? (
            <Card>
              <CardHeader title="Due now" action={<SeeAll href="/recurring">All repeats</SeeAll>} />
              <DueRecurring
                items={dueRules.map((r) => ({
                  id: r.id,
                  title: r.note || r.category?.name || (r.type === "TRANSFER" ? "Transfer" : "Repeating transaction"),
                  amount: formatMoney(r.amount, r.account.currency),
                  when: dueLabel(r.nextDate, today),
                  accountName: r.account.name,
                  more: Math.max(0, dueCount(r.nextDate, r.frequency as Frequency, r.anchorDay, r.endDate, today) - 1),
                }))}
              />
            </Card>
          ) : null}

          {budgetRows.some((r) => r.limit !== null) ? (
            <Card>
              <CardHeader title="Budgets" action={<SeeAll href="/budgets">All budgets</SeeAll>} />
              <ul className="space-y-4 p-5">
                {budgetRows
                  .filter((r) => r.limit !== null)
                  .slice(0, 3)
                  .map((r) => {
                    const status = budgetStatus(r.spent, r.limit!);
                    return (
                      <li key={r.category.id}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="min-w-0 truncate font-medium">{r.category.name}</span>
                          <span className={cn("shrink-0 text-xs font-semibold tabular-nums", status.level === "over" ? "text-danger" : "text-ink-soft")}>
                            {status.level === "over" ? `Over by ${formatMoney(-status.left, currency)}` : `${formatMoney(status.left, currency)} left`}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                          <div
                            className={cn("h-full rounded-full", status.level === "over" ? "bg-danger" : status.level === "warn" ? "bg-warning" : "bg-primary")}
                            style={{ width: `${Math.min(100, status.ratio * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </Card>
          ) : null}

          {goals.length > 0 ? (
            <Card>
              <CardHeader title="Goals" action={<SeeAll href="/goals">All goals</SeeAll>} />
              <ul className="space-y-4 p-5">
                {goals.slice(0, 3).map((g) => {
                  const p = goalProgress(g.saved, g.targetAmount, g.targetDate, today);
                  return (
                    <li key={g.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{g.name}</span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-soft">
                          {formatMoney(p.saved, g.currency)} / {formatMoney(p.target, g.currency)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <div className={cn("h-full rounded-full", p.reached ? "bg-income" : "bg-primary")} style={{ width: `${p.ratio * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Spending this month" action={<SeeAll href="/statistics">Details</SeeAll>} />
            <div className="p-5">
              {breakdown.length > 0 ? (
                <CategoryBars data={breakdown} currency={currency} limit={6} />
              ) : (
                <p className="flex items-center gap-2 text-sm text-ink-soft">
                  <ChartBar className="size-4" aria-hidden />
                  No {currency} spending this month yet.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Wallet" action={<SeeAll href="/accounts">See all</SeeAll>} />
            <ul className="space-y-1 p-3">
              {accounts
                .filter((a) => a.type !== "SAVINGS")
                .map((a) => (
                <li key={a.id}>
                  <MaybeLink
                    href={readOnly ? undefined : `/accounts/${a.id}`}
                    className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5", !readOnly && "transition-colors hover:bg-muted")}
                  >
                    <ColorDot color={a.color} className="size-3" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{a.name}</span>
                      <span className="block text-xs text-ink-soft">{accountTypeLabel(a.type)}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{formatMoney(a.balance, a.currency)}</span>
                  </MaybeLink>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
