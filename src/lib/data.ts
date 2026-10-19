import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { TransactionType } from "@/generated/prisma/enums";
import { db } from "./db";
import { monthKeyOf, monthRange, shiftMonth, yearRange, type MonthKey } from "./dates";

export type AccountWithBalance = Awaited<ReturnType<typeof getAccounts>>[number];

/** Accounts with their current balance (initial balance + all activity). */
export async function getAccounts(userId: string, opts: { includeArchived?: boolean } = {}) {
  const [accounts, outgoing, incoming] = await Promise.all([
    db.account.findMany({
      where: { userId, ...(opts.includeArchived ? {} : { archived: false }) },
      orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
    }),
    db.transaction.groupBy({
      by: ["accountId", "type"],
      where: { userId },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ["toAccountId"],
      where: { userId, type: "TRANSFER" },
      _sum: { toAmount: true },
    }),
  ]);

  const delta = new Map<string, number>();
  const add = (id: string, value: number) => delta.set(id, (delta.get(id) ?? 0) + value);

  for (const row of outgoing) {
    const sum = row._sum.amount ?? 0;
    add(row.accountId, row.type === "INCOME" ? sum : -sum);
  }
  for (const row of incoming) {
    if (row.toAccountId) {
      add(row.toAccountId, row._sum.toAmount ?? 0);
    }
  }

  return accounts.map((account) => ({
    ...account,
    balance: account.initialBalance + (delta.get(account.id) ?? 0),
  }));
}

export type CurrencyTotals = { currency: string; income: number; expense: number }[];

/** Income and expense per currency in a date range. Transfers are not counted. */
export async function getTotalsByCurrency(userId: string, start: Date, end: Date): Promise<CurrencyTotals> {
  const rows = await db.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId, type: { in: ["INCOME", "EXPENSE"] }, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  if (rows.length === 0) {
    return [];
  }

  const accounts = await db.account.findMany({
    where: { id: { in: [...new Set(rows.map((r) => r.accountId))] } },
    select: { id: true, currency: true },
  });
  const currencyOf = new Map(accounts.map((a) => [a.id, a.currency]));

  const totals = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    const currency = currencyOf.get(row.accountId) ?? "LKR";
    const entry = totals.get(currency) ?? { income: 0, expense: 0 };
    if (row.type === "INCOME") {
      entry.income += row._sum.amount ?? 0;
    } else {
      entry.expense += row._sum.amount ?? 0;
    }
    totals.set(currency, entry);
  }
  return [...totals].map(([currency, t]) => ({ currency, ...t }));
}

export type CategoryBreakdown = {
  id: string | null;
  name: string;
  color: string;
  icon: string;
  total: number;
  count: number;
}[];

/** Totals per category for one transaction type and currency, largest first. */
export async function getCategoryBreakdown(
  userId: string,
  type: "INCOME" | "EXPENSE",
  currency: string,
  start: Date,
  end: Date,
): Promise<CategoryBreakdown> {
  const rows = await db.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type, date: { gte: start, lt: end }, account: { currency } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const categories = await db.category.findMany({
    where: { id: { in: rows.flatMap((r) => (r.categoryId ? [r.categoryId] : [])) } },
    select: { id: true, name: true, color: true, icon: true },
  });
  const byId = new Map(categories.map((c) => [c.id, c]));

  return rows
    .map((row) => {
      const category = row.categoryId ? byId.get(row.categoryId) : undefined;
      return {
        id: row.categoryId,
        name: category?.name ?? "Uncategorized",
        color: category?.color ?? "#8a8984",
        icon: category?.icon ?? "other",
        total: row._sum.amount ?? 0,
        count: row._count._all,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export type MonthlyTrend = { month: MonthKey; income: number; expense: number }[];

/** Income vs expense for each month from `first` to `last` inclusive, in one currency. */
export async function getMonthlyTrend(
  userId: string,
  currency: string,
  first: MonthKey,
  last: MonthKey,
): Promise<MonthlyTrend> {
  const rows = await db.transaction.findMany({
    where: {
      userId,
      type: { in: ["INCOME", "EXPENSE"] },
      date: { gte: monthRange(first).start, lt: monthRange(last).end },
      account: { currency },
    },
    select: { type: true, amount: true, date: true },
  });

  const months: MonthlyTrend = [];
  for (let key = first; key <= last; key = shiftMonth(key, 1)) {
    months.push({ month: key, income: 0, expense: 0 });
  }
  const index = new Map(months.map((m, i) => [m.month, i]));
  for (const row of rows) {
    const i = index.get(monthKeyOf(row.date));
    if (i === undefined) continue;
    if (row.type === "INCOME") months[i].income += row.amount;
    else months[i].expense += row.amount;
  }
  return months;
}

export const transactionInclude = {
  account: { select: { id: true, name: true, currency: true, color: true } },
  toAccount: { select: { id: true, name: true, currency: true, color: true } },
  category: { select: { id: true, name: true, color: true, icon: true } },
  tags: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } },
} satisfies Prisma.TransactionInclude;

export type TransactionRow = Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>;

export type TransactionFilters = {
  month: MonthKey;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  tagId?: string;
  q?: string;
};

export async function getTransactions(userId: string, filters: TransactionFilters) {
  const { start, end } = monthRange(filters.month);
  const where: Prisma.TransactionWhereInput = {
    userId,
    date: { gte: start, lt: end },
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.tagId ? { tags: { some: { id: filters.tagId } } } : {}),
    ...(filters.accountId
      ? { OR: [{ accountId: filters.accountId }, { toAccountId: filters.accountId }] }
      : {}),
    ...(filters.q ? { note: { contains: filters.q } } : {}),
  };

  return db.transaction.findMany({
    where,
    include: transactionInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function getRecentTransactions(userId: string, take = 8) {
  return db.transaction.findMany({
    where: { userId },
    include: transactionInclude,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take,
  });
}

export async function getTransaction(userId: string, id: string) {
  return db.transaction.findFirst({ where: { id, userId }, include: transactionInclude });
}

export async function getCategories(userId: string) {
  return db.category.findMany({
    where: { userId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: { _count: { select: { transactions: true } } },
  });
}

export async function getTags(userId: string) {
  return db.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });
}

export function periodRange(period: "month" | "year", key: string) {
  return period === "year" ? yearRange(Number(key)) : monthRange(key);
}
