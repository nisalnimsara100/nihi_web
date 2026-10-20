import type { Metadata } from "next";
import { Suspense } from "react";
import { PeriodNav } from "@/components/finance/month-nav";
import { Card, PageHeader, PageSkeleton } from "@/components/ui";
import { Target } from "@/components/icons";
import { getViewer } from "@/lib/auth";
import { budgetStatus, monthProgress } from "@/lib/budgets";
import { getBudgetRows } from "@/lib/data";
import { currentMonthKey, formatMonth, isMonthKey, shiftMonth, todayDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { buildHref, param, type SearchParams } from "@/lib/search-params";
import { cn } from "@/lib/cn";
import { BudgetRow } from "./budget-row";

export const metadata: Metadata = { title: "Budgets" };

export default function BudgetsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Budgets searchParams={searchParams} />
    </Suspense>
  );
}

async function Budgets({ searchParams }: { searchParams: SearchParams }) {
  const { owner: user, readOnly } = await getViewer();
  const sp = await searchParams;
  const monthParam = param(sp, "month");
  const month = isMonthKey(monthParam) ? monthParam : currentMonthKey();
  const currency = user.defaultCurrency;
  const rows = await getBudgetRows(user.id, currency, month);

  const budgeted = rows.filter((r) => r.limit !== null);
  const totalLimit = budgeted.reduce((s, r) => s + (r.limit ?? 0), 0);
  const totalSpent = budgeted.reduce((s, r) => s + r.spent, 0);
  const total = totalLimit > 0 ? budgetStatus(totalSpent, totalLimit) : null;
  const overCount = budgeted.filter((r) => r.limit && r.spent >= r.limit).length;
  const warnCount = budgeted.filter((r) => r.limit && r.spent < r.limit && r.spent >= r.limit * 0.8).length;
  // Spending ahead of the calendar only means something while the month is still running.
  const running = month === currentMonthKey();
  const pace = running ? monthProgress(todayDay()) : null;

  const href = (m: string) => buildHref("/budgets", { month: m });

  return (
    <>
      <PageHeader
        title="Budgets"
        description={`Monthly limits in ${currency}`}
        actions={<PeriodNav label={formatMonth(month)} prevHref={href(shiftMonth(month, -1))} nextHref={href(shiftMonth(month, 1))} />}
      />

      {total ? (
        <Card className="mb-4 p-5">
          <p className="text-sm font-semibold text-ink-soft">All budgets together</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatMoney(totalSpent, currency)} <span className="text-base font-medium text-ink-soft">of {formatMoney(totalLimit, currency)}</span>
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className={cn("h-full rounded-full", total.level === "over" ? "bg-danger" : total.level === "warn" ? "bg-warning" : "bg-primary")}
              style={{ width: `${Math.min(100, total.ratio * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            {overCount > 0 ? `${overCount} over the limit` : "None over the limit"}
            {warnCount > 0 ? ` · ${warnCount} close to it` : ""}
          </p>
        </Card>
      ) : null}

      <Card className="px-4 sm:px-5">
        {rows.length === 0 ? (
          <p className="flex items-center gap-2 py-8 text-sm text-ink-soft">
            <Target className="size-5" aria-hidden /> Add an expense category first, then set a limit for it here.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <BudgetRow
                key={r.category.id}
                readOnly={readOnly}
                currency={currency}
                item={{ categoryId: r.category.id, name: r.category.name, color: r.category.color, icon: r.category.icon, limit: r.limit, spent: r.spent }}
                paceNote={pace !== null && r.limit && r.spent / r.limit > pace + 0.2 ? "spending faster than the month" : undefined}
              />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
