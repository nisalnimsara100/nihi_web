import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryBars } from "@/components/finance/category-bars";
import { PeriodNav } from "@/components/finance/month-nav";
import { StatTile } from "@/components/finance/stat-tile";
import { Card, CardHeader, PageHeader, PageSkeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCategoryBreakdown, getMonthlyTrend, periodRange } from "@/lib/data";
import { currentMonthKey, formatMonth, formatMonthShort, isMonthKey, shiftMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { buildHref, param, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/cn";
import { TrendChart } from "./trend-chart";

export const metadata: Metadata = { title: "Statistics" };

export default function StatisticsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Statistics searchParams={searchParams} />
    </Suspense>
  );
}

async function Statistics({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  const sp = await searchParams;

  const period = param(sp, "period") === "year" ? "year" : "month";
  const thisMonth = currentMonthKey();
  const rawKey = param(sp, "date");
  const key =
    period === "year"
      ? /^\d{4}$/.test(rawKey ?? "") ? rawKey! : thisMonth.slice(0, 4)
      : isMonthKey(rawKey) ? rawKey : thisMonth;

  const currencies = (
    await db.account.findMany({ where: { userId: user.id }, select: { currency: true }, distinct: ["currency"] })
  ).map((a) => a.currency);
  const currencyParam = param(sp, "currency");
  const currency = currencyParam && currencies.includes(currencyParam) ? currencyParam : user.defaultCurrency;

  const { start, end } = periodRange(period, key);
  const [first, last] = period === "year" ? [`${key}-01`, `${key}-12`] : [shiftMonth(key, -11), key];

  const [expenses, income, trend] = await Promise.all([
    getCategoryBreakdown(user.id, "EXPENSE", currency, start, end),
    getCategoryBreakdown(user.id, "INCOME", currency, start, end),
    getMonthlyTrend(user.id, currency, first, last),
  ]);

  const totalIncome = income.reduce((s, r) => s + r.total, 0);
  const totalExpense = expenses.reduce((s, r) => s + r.total, 0);
  const net = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : null;

  const label = period === "year" ? key : formatMonth(key);
  const shift = (delta: number) =>
    period === "year" ? String(Number(key) + delta) : shiftMonth(key, delta);
  const href = (overrides: Record<string, string | undefined>) =>
    buildHref("/statistics", { period, date: key, currency, ...overrides });

  const trendData = trend.map((m) => ({
    label: formatMonthShort(m.month),
    fullLabel: formatMonth(m.month),
    income: m.income,
    expense: m.expense,
  }));

  return (
    <>
      <PageHeader
        title="Statistics"
        description={`${currency} accounts only`}
        actions={<PeriodNav label={label} prevHref={href({ date: shift(-1) })} nextHref={href({ date: shift(1) })} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full bg-surface p-1 ring-1 ring-line/60" role="group" aria-label="Period">
          {(["month", "year"] as const).map((p) => (
            <Link
              key={p}
              href={href({ period: p, date: p === "year" ? key.slice(0, 4) : `${key.slice(0, 4)}-${thisMonth.slice(5)}` })}
              aria-current={period === p ? "true" : undefined}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold",
                period === p
                  ? "bg-forest text-on-forest"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              {p === "month" ? "Month" : "Year"}
            </Link>
          ))}
        </div>
        {currencies.length > 1 ? (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Currency">
            {currencies.map((c) => (
              <Link
                key={c}
                href={href({ currency: c })}
                aria-current={c === currency ? "true" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  c === currency
                    ? "bg-lime text-on-lime"
                    : "bg-surface text-ink-soft ring-1 ring-line/60 hover:text-ink",
                )}
              >
                {c}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Income" value={formatMoney(totalIncome, currency)} />
        <StatTile label="Expenses" value={formatMoney(totalExpense, currency)} />
        <StatTile label="Net" value={formatMoney(net, currency, { signed: true })} />
        <StatTile label="Savings rate" value={savingsRate === null ? "—" : `${savingsRate}%`} sub="Net ÷ income" />
      </div>

      <Card className="mt-4">
        <CardHeader title={period === "year" ? `Monthly trend in ${key}` : "Last 12 months"} />
        <div className="p-4 sm:p-5">
          <TrendChart data={trendData} currency={currency} />
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-ink-soft hover:text-ink">
              Show as table
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left tabular-nums">
                <thead className="text-xs text-ink-soft">
                  <tr>
                    <th className="py-2 font-medium">Month</th>
                    <th className="py-2 text-right font-medium">Income</th>
                    <th className="py-2 text-right font-medium">Expenses</th>
                    <th className="py-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {trendData.map((row) => (
                    <tr key={row.fullLabel}>
                      <td className="py-2">{row.fullLabel}</td>
                      <td className="py-2 text-right">{formatMoney(row.income, currency)}</td>
                      <td className="py-2 text-right">{formatMoney(row.expense, currency)}</td>
                      <td className="py-2 text-right">{formatMoney(row.income - row.expense, currency, { signed: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </Card>

      <div className="mt-4 grid items-start gap-4 *:min-w-0 lg:grid-cols-2">
        <Card>
          <CardHeader title="Expenses by category" />
          <div className="p-4 sm:p-5">
            {expenses.length > 0 ? (
              <CategoryBars data={expenses} currency={currency} />
            ) : (
              <p className="text-sm text-ink-soft">No expenses in {label}.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Income by category" />
          <div className="p-4 sm:p-5">
            {income.length > 0 ? (
              <CategoryBars data={income} currency={currency} />
            ) : (
              <p className="text-sm text-ink-soft">No income in {label}.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
