import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { MagnifyingGlass, Plus, Receipt } from "@/components/icons";
import { PeriodNav } from "@/components/finance/month-nav";
import { TransactionList } from "@/components/finance/transaction-list";
import { Button, ButtonLink, Card, EmptyState, inputClass, PageHeader, PageSkeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getAccounts, getCategories, getTags, getTransactions, getTotalsByCurrency } from "@/lib/data";
import { currentMonthKey, formatMonth, isMonthKey, monthRange, shiftMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { buildHref, param, type SearchParams } from "@/lib/search-params";
import { FilterPanel } from "./filter-panel";

export const metadata: Metadata = { title: "Transactions" };

const TYPES = [
  { value: "EXPENSE", label: "Expenses" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfers" },
] as const;

export default function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Transactions searchParams={searchParams} />
    </Suspense>
  );
}

async function Transactions({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  const sp = await searchParams;

  const monthParam = param(sp, "month");
  const month = isMonthKey(monthParam) ? monthParam : currentMonthKey();
  const typeParam = param(sp, "type");
  const filters = {
    type: TYPES.some((t) => t.value === typeParam) ? (typeParam as (typeof TYPES)[number]["value"]) : undefined,
    account: param(sp, "account"),
    category: param(sp, "category"),
    tag: param(sp, "tag"),
    q: param(sp, "q"),
  };

  const { start, end } = monthRange(month);
  const [transactions, totals, accounts, categories, tags] = await Promise.all([
    getTransactions(user.id, {
      month,
      type: filters.type,
      accountId: filters.account,
      categoryId: filters.category,
      tagId: filters.tag,
      q: filters.q,
    }),
    getTotalsByCurrency(user.id, start, end),
    getAccounts(user.id, { includeArchived: true }),
    getCategories(user.id),
    getTags(user.id),
  ]);

  const activeCount = Object.values(filters).filter(Boolean).length;
  const monthHref = (delta: number) => buildHref("/transactions", { ...filters, month: shiftMonth(month, delta) });

  return (
    <>
      <PageHeader
        title="Transactions"
        description={`${transactions.length} in ${formatMonth(month)}`}
        actions={
          <>
            <PeriodNav label={formatMonth(month)} prevHref={monthHref(-1)} nextHref={monthHref(1)} />
            <ButtonLink href="/transactions/new" size="sm" className="hidden sm:inline-flex">
              <Plus className="size-4" aria-hidden />
              New
            </ButtonLink>
          </>
        }
      />

      <FilterPanel activeCount={activeCount}>
        <Form action="/transactions" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <input type="hidden" name="month" value={month} />
          <label className="relative col-span-2 sm:col-span-3 lg:col-span-2">
            <span className="sr-only">Search notes</span>
            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
            <input name="q" defaultValue={filters.q} placeholder="Search notes" className={`${inputClass} pl-9`} />
          </label>
          <select name="type" defaultValue={filters.type ?? ""} aria-label="Type" className={inputClass}>
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select name="account" defaultValue={filters.account ?? ""} aria-label="Account" className={inputClass}>
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select name="category" defaultValue={filters.category ?? ""} aria-label="Category" className={inputClass}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === "INCOME" ? "income" : "expense"})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select name="tag" defaultValue={filters.tag ?? ""} aria-label="Tag" className={inputClass}>
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex gap-2 sm:col-span-3 lg:col-span-6">
            <Button type="submit" size="sm">
              Apply filters
            </Button>
            {activeCount > 0 ? (
              <Link href={buildHref("/transactions", { month })} className="inline-flex h-9 items-center px-3 text-sm font-semibold text-ink-soft hover:underline">
                Clear
              </Link>
            ) : null}
          </div>
        </Form>
      </FilterPanel>

      {totals.length > 0 ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {totals.map((t) => (
            <Card key={t.currency} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="font-medium">{t.currency}</span>
              <span className="flex flex-wrap justify-end gap-x-3 gap-y-1 tabular-nums">
                <span className="text-income">+{formatMoney(t.income, t.currency)}</span>
                <span>-{formatMoney(t.expense, t.currency)}</span>
                <span className="text-ink-soft">= {formatMoney(t.income - t.expense, t.currency)}</span>
              </span>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="rounded-3xl bg-muted p-4 sm:p-5">
        {transactions.length > 0 ? (
          <TransactionList transactions={transactions} />
        ) : (
          <EmptyState
            icon={<Receipt className="size-6" />}
            title={activeCount > 0 ? "Nothing matches these filters" : "No transactions this month"}
            description={activeCount > 0 ? "Try clearing a filter or picking another month." : "Add one to start tracking."}
            action={<ButtonLink href="/transactions/new">Add transaction</ButtonLink>}
          />
        )}
      </div>
    </>
  );
}
