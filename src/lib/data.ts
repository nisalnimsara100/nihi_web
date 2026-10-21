import "server-only";
import type { Enums } from "./database.types";
import { db, isId, run } from "./db";
import { monthRange, shiftMonth, yearRange, type MonthKey } from "./dates";

type TransactionType = Enums<"TransactionType">;

export type AccountWithBalance = Awaited<ReturnType<typeof getAccounts>>[number];

/** Accounts with their current balance (initial balance + all activity). */
export async function getAccounts(userId: string, opts: { includeArchived?: boolean } = {}) {
  let accountsQuery = db().from("Account").select("*").eq("userId", userId);
  if (!opts.includeArchived) {
    accountsQuery = accountsQuery.eq("archived", false);
  }
  const [accounts, deltas] = await Promise.all([
    run(accountsQuery.order("archived").order("sortOrder").order("createdAt")),
    run(db().rpc("account_balance_deltas", { p_user_id: userId })),
  ]);

  const delta = new Map(deltas.map((d) => [d.accountId, d.delta]));
  return accounts.map((account) => ({
    ...account,
    balance: account.initialBalance + (delta.get(account.id) ?? 0),
  }));
}

/** Cards (last 4 digits only) the user has linked to their accounts. */
export async function getCards(userId: string, accountId?: string) {
  let query = db().from("Card").select("id, accountId, last4, name, network").eq("userId", userId);
  if (accountId) {
    query = query.eq("accountId", accountId);
  }
  return run(query.order("createdAt"));
}

export type CurrencyTotals = { currency: string; income: number; expense: number }[];

/** Income and expense per currency in a date range. Transfers are not counted. */
export async function getTotalsByCurrency(userId: string, start: Date, end: Date): Promise<CurrencyTotals> {
  return run(
    db().rpc("totals_by_currency", { p_user_id: userId, p_start: start.toISOString(), p_end: end.toISOString() }),
  );
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
  const rows = await run(
    db().rpc("category_breakdown", {
      p_user_id: userId,
      p_type: type,
      p_currency: currency,
      p_start: start.toISOString(),
      p_end: end.toISOString(),
    }),
  );

  // Uncategorized transactions come back as one row with a null category.
  return rows
    .map((row) => ({
      id: row.id ?? null,
      name: row.name ?? "Uncategorized",
      color: row.color ?? "#8a8984",
      icon: row.icon ?? "other",
      total: row.total,
      count: row.count,
    }))
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
  const rows = await run(
    db().rpc("monthly_totals", {
      p_user_id: userId,
      p_currency: currency,
      p_start: monthRange(first).start.toISOString(),
      p_end: monthRange(last).end.toISOString(),
    }),
  );
  const byMonth = new Map(rows.map((r) => [r.month, r]));

  const months: MonthlyTrend = [];
  for (let key = first; key <= last; key = shiftMonth(key, 1)) {
    const row = byMonth.get(key);
    months.push({ month: key, income: row?.income ?? 0, expense: row?.expense ?? 0 });
  }
  return months;
}

const transactionSelect = `*,
  account:Account!Transaction_accountId_fkey(id, name, currency, color),
  toAccount:Account!Transaction_toAccountId_fkey(id, name, currency, color),
  category:Category(id, name, color, icon),
  card:Card(id, last4, network),
  tags:Tag(id, name, color)`;

function transactionQuery(userId: string) {
  return db()
    .from("Transaction")
    .select(transactionSelect)
    .eq("userId", userId)
    .order("date", { ascending: false })
    .order("createdAt", { ascending: false });
}

type TransactionResult = NonNullable<Awaited<ReturnType<typeof transactionQuery>>["data"]>[number];

/** Supabase returns timestamps as ISO strings; the app works with Dates and sorted tags. */
function toTransactionRow(row: TransactionResult) {
  return {
    ...row,
    date: new Date(row.date),
    createdAt: new Date(row.createdAt),
    tags: [...row.tags].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export type TransactionRow = ReturnType<typeof toTransactionRow>;

export type TransactionFilters = {
  month: MonthKey;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  tagId?: string;
  q?: string;
};

/** Escapes LIKE wildcards so a search for "50%" matches the text literally. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export async function getTransactions(userId: string, filters: TransactionFilters): Promise<TransactionRow[]> {
  const { start, end } = monthRange(filters.month);
  if ([filters.accountId, filters.categoryId, filters.tagId].some((id) => id !== undefined && !isId(id))) {
    return [];
  }

  let query = transactionQuery(userId).gte("date", start.toISOString()).lt("date", end.toISOString());
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.categoryId) query = query.eq("categoryId", filters.categoryId);
  if (filters.accountId) query = query.or(`accountId.eq.${filters.accountId},toAccountId.eq.${filters.accountId}`);
  if (filters.q) query = query.ilike("note", `%${escapeLike(filters.q)}%`);

  const rows = (await run(query)).map(toTransactionRow);
  // A month holds few enough rows that the tag filter can run here.
  return filters.tagId ? rows.filter((row) => row.tags.some((t) => t.id === filters.tagId)) : rows;
}

export async function getRecentTransactions(userId: string, take = 8) {
  return (await run(transactionQuery(userId).limit(take))).map(toTransactionRow);
}

export async function getTransaction(userId: string, id: string) {
  const row = await run(transactionQuery(userId).eq("id", id).maybeSingle());
  return row ? toTransactionRow(row) : null;
}

export async function getTransactionImages(userId: string, transactionId: string) {
  return run(
    db().from("TransactionImage").select("url, publicId").eq("transactionId", transactionId).eq("userId", userId).order("createdAt"),
  );
}

export async function getCategories(userId: string) {
  const rows = await run(
    db().from("Category").select("*, Transaction(count)").eq("userId", userId).order("type").order("name"),
  );
  return rows.map(({ Transaction, ...category }) => ({ ...category, transactionCount: Transaction[0]?.count ?? 0 }));
}

export async function getTags(userId: string) {
  const rows = await run(db().from("Tag").select("*, TransactionTag(count)").eq("userId", userId).order("name"));
  return rows.map(({ TransactionTag, ...tag }) => ({ ...tag, transactionCount: TransactionTag[0]?.count ?? 0 }));
}

export function periodRange(period: "month" | "year", key: string) {
  return period === "year" ? yearRange(Number(key)) : monthRange(key);
}

export type BudgetRow = {
  category: { id: string; name: string; color: string; icon: string };
  budgetId: string | null;
  limit: number | null;
  spent: number;
};

/**
 * Every expense category with its monthly limit (if set) and what was spent in that month,
 * from accounts in `currency`. Categories with a budget come first, then ones with spending only.
 */
export async function getBudgetRows(userId: string, currency: string, month: MonthKey): Promise<BudgetRow[]> {
  const { start, end } = monthRange(month);
  const [categories, budgets, breakdown] = await Promise.all([
    run(db().from("Category").select("id, name, color, icon").eq("userId", userId).eq("type", "EXPENSE").order("name")),
    run(db().from("Budget").select("id, categoryId, amount").eq("userId", userId).eq("currency", currency)),
    getCategoryBreakdown(userId, "EXPENSE", currency, start, end),
  ]);
  const limitOf = new Map(budgets.map((b) => [b.categoryId, b]));
  const spentOf = new Map(breakdown.map((b) => [b.id, b.total]));
  const rows = categories.map((category) => ({
    category,
    budgetId: limitOf.get(category.id)?.id ?? null,
    limit: limitOf.get(category.id)?.amount ?? null,
    spent: spentOf.get(category.id) ?? 0,
  }));
  const ratio = (r: BudgetRow) => (r.limit ? r.spent / r.limit : -1);
  return rows.sort((a, b) => Number(b.limit !== null) - Number(a.limit !== null) || ratio(b) - ratio(a) || b.spent - a.spent);
}

const recurringSelect = `*,
  account:Account!Recurring_accountId_fkey(id, name, currency),
  toAccount:Account!Recurring_toAccountId_fkey(id, name, currency),
  category:Category(id, name, color, icon)`;

/** All repeating transactions, the next one due first. */
export async function getRecurring(userId: string) {
  return run(db().from("Recurring").select(recurringSelect).eq("userId", userId).order("active", { ascending: false }).order("nextDate"));
}

export type RecurringRow = Awaited<ReturnType<typeof getRecurring>>[number];

export async function getRecurringById(userId: string, id: string) {
  if (!isId(id)) return null;
  return run(db().from("Recurring").select("*").eq("id", id).eq("userId", userId).maybeSingle());
}

/** Active rules whose next date is today or earlier. */
export async function getDueRecurring(userId: string, today: string) {
  return run(
    db().from("Recurring").select(recurringSelect).eq("userId", userId).eq("active", true).lte("nextDate", today).order("nextDate"),
  );
}

/** Savings goals with the amount saved so far: the linked account's balance, or the hand-kept amount. */
export async function getGoals(userId: string) {
  const [goals, accounts] = await Promise.all([
    run(db().from("SavingsGoal").select("*").eq("userId", userId).order("createdAt")),
    getAccounts(userId, { includeArchived: true }),
  ]);
  const balanceOf = new Map(accounts.map((a) => [a.id, a]));
  return goals.map((g) => {
    const account = g.accountId ? balanceOf.get(g.accountId) : undefined;
    return { ...g, accountName: account?.name ?? null, saved: account ? Math.max(0, account.balance) : g.savedAmount };
  });
}

export type GoalRow = Awaited<ReturnType<typeof getGoals>>[number];

/** Active repeats whose next date is after `after` and no later than `until`. */
export async function getUpcomingRecurring(userId: string, after: string, until: string) {
  return run(
    db().from("Recurring").select(recurringSelect).eq("userId", userId).eq("active", true).gt("nextDate", after).lte("nextDate", until).order("nextDate"),
  );
}
