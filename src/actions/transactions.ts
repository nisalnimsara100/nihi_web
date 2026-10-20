"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import type { TxSnapshot } from "@/lib/tx-snapshot";
import { Constants, type Database } from "@/lib/database.types";
import { db, isId, run } from "@/lib/db";
import { dayToDate } from "@/lib/dates";
import { flash } from "@/lib/flash";
import { formatMoney, parseAmount } from "@/lib/money";
import { fromZodError, type ActionState } from "./state";

const amountField = (label: string) =>
  z.string().transform((v, ctx) => {
    if (!v.trim()) return null;
    const amount = parseAmount(v);
    if (amount === null || amount <= 0) {
      ctx.addIssue({ code: "custom", message: `Enter a valid ${label} greater than 0` });
      return z.NEVER;
    }
    return amount;
  });

const transactionSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(Constants.public.Enums.TransactionType),
    amount: amountField("amount"),
    toAmount: amountField("amount").optional(),
    accountId: z.string().min(1, "Choose an account"),
    toAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    cardId: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
    note: z.string().trim().max(500).default(""),
  })
  .superRefine((data, ctx) => {
    if (data.amount === null) {
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Enter an amount" });
    }
    if (data.type === "TRANSFER") {
      if (!data.toAccountId) {
        ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Choose where the money goes" });
      } else if (data.toAccountId === data.accountId) {
        ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Pick a different account" });
      }
    }
  });

type Saved = { state: ActionState } | { saved: { amount: number; currency: string; kind: string; updated: boolean } };

/** Validates and saves one transaction. Shared by the form and by the offline queue. */
async function persist(userId: string, formData: FormData): Promise<Saved> {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { state: fromZodError(parsed.error) };
  }
  const data = parsed.data;
  const isTransfer = data.type === "TRANSFER";
  const tagIds = formData.getAll("tags").map(String);

  // Every referenced record must belong to this user.
  const accountIds = [data.accountId, ...(isTransfer && data.toAccountId ? [data.toAccountId] : [])];
  const [accounts, category, tags, card] = await Promise.all([
    run(db().from("Account").select("id, currency").in("id", accountIds).eq("userId", userId)),
    !isTransfer && data.categoryId
      ? run(
          db()
            .from("Category")
            .select("id")
            .eq("id", data.categoryId)
            .eq("userId", userId)
            .eq("type", data.type as "INCOME" | "EXPENSE")
            .maybeSingle(),
        )
      : null,
    tagIds.length > 0 ? run(db().from("Tag").select("id").in("id", tagIds).eq("userId", userId)) : [],
    // The card must be one of this account's linked cards.
    !isTransfer && data.cardId
      ? run(db().from("Card").select("id").eq("id", data.cardId).eq("userId", userId).eq("accountId", data.accountId).maybeSingle())
      : null,
  ]);
  if (accounts.length !== accountIds.length) {
    return { state: { error: "Account not found." } };
  }
  if (!isTransfer && data.categoryId && !category) {
    return { state: { fieldErrors: { categoryId: ["Choose a category of the same type"] } } };
  }

  if (!isTransfer && data.cardId && !card) {
    return { state: { fieldErrors: { cardId: ["Choose a card linked to this account"] } } };
  }

  const amount = data.amount!;
  const args = {
    p_user_id: userId,
    p_id: data.id ?? null,
    p_type: data.type,
    p_amount: amount,
    p_account_id: data.accountId,
    p_to_account_id: isTransfer ? data.toAccountId! : null,
    p_to_amount: isTransfer ? (data.toAmount ?? amount) : null,
    p_category_id: isTransfer ? null : (category?.id ?? null),
    p_date: dayToDate(data.date).toISOString(),
    p_note: data.note,
    p_tag_ids: tags.map((t) => t.id),
    p_card_id: card?.id ?? null,
  };

  // Generated types mark every function argument as required and non-null,
  // but save_transaction takes null for a new transaction and for unused fields.
  const savedId = await run(
    db().rpc("save_transaction", args as Database["public"]["Functions"]["save_transaction"]["Args"]),
  );
  if (!savedId) {
    return { state: { error: "Transaction not found." } };
  }
  const currency = accounts.find((a) => a.id === data.accountId)?.currency ?? "LKR";
  const kind = { INCOME: "Income", EXPENSE: "Expense", TRANSFER: "Transfer" }[data.type];
  return { saved: { amount, currency, kind, updated: !!data.id } };
}

export async function saveTransaction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const result = await persist(userId, formData);
  if ("state" in result) {
    return result.state;
  }
  const { amount, currency, kind, updated } = result.saved;
  await flash({
    type: "success",
    title: updated ? "Transaction updated" : "Transaction added",
    description: `${kind} · ${formatMoney(amount, currency)}`,
  });

  revalidatePath("/", "layout");
  redirect("/transactions");
}

/**
 * Adds a transaction that was filled in while offline, now that the phone is back online. It does
 * not redirect, so the page the user is on stays put. `entries` are the form's field names and values.
 */
export async function syncQueuedTransaction(entries: [string, string][]): Promise<ActionState> {
  const userId = await requireUserId();
  const formData = new FormData();
  for (const [key, value] of entries.slice(0, 60)) {
    // An offline entry is always a new transaction.
    if (key !== "id") formData.append(key, String(value).slice(0, 600));
  }
  const result = await persist(userId, formData);
  if ("state" in result) {
    const first = Object.values(result.state.fieldErrors ?? {}).flat()[0];
    return { error: first ?? result.state.error ?? "This could not be added." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Added", detail: `${result.saved.kind} · ${formatMoney(result.saved.amount, result.saved.currency)}` };
}

export type DeleteResult = ActionState & { snapshots?: TxSnapshot[] };

/** Reads the transactions a delete is about to remove, so they can be put back with Undo. */
async function snapshotOf(userId: string, ids: string[]): Promise<TxSnapshot[]> {
  const rows = await run(db().from("Transaction").select("*").eq("userId", userId).in("id", ids));
  const tags = rows.length > 0 ? await run(db().from("TransactionTag").select("transactionId, tagId").in("transactionId", rows.map((r) => r.id))) : [];
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: r.amount,
    toAmount: r.toAmount,
    accountId: r.accountId,
    toAccountId: r.toAccountId,
    categoryId: r.categoryId,
    cardId: r.cardId,
    date: r.date,
    note: r.note,
    createdAt: r.createdAt,
    tagIds: tags.filter((t) => t.transactionId === r.id).map((t) => t.tagId),
  }));
}

/** Deletes transactions and returns what was removed so the page can offer Undo. */
export async function deleteTransactions(ids: string[]): Promise<DeleteResult> {
  const userId = await requireUserId();
  const clean = [...new Set(ids)].filter(isId);
  if (clean.length === 0 || clean.length > 500) {
    return { error: "Choose the transactions to delete." };
  }
  const snapshots = await snapshotOf(userId, clean);
  if (snapshots.length === 0) {
    return { error: "Transaction not found." };
  }
  await run(db().from("Transaction").delete().eq("userId", userId).in("id", snapshots.map((s) => s.id)).select("id"));
  revalidatePath("/", "layout");
  return {
    ok: true,
    snapshots,
    message: snapshots.length === 1 ? "Transaction deleted" : `${snapshots.length} transactions deleted`,
  };
}

export async function deleteTransaction(id: string): Promise<DeleteResult> {
  return deleteTransactions([id]);
}

/** Puts back transactions deleted a moment ago, with the same ids, dates and tags. */
export async function restoreTransactions(snapshots: TxSnapshot[]): Promise<ActionState> {
  const userId = await requireUserId();
  if (snapshots.length === 0 || snapshots.length > 500 || !snapshots.every((s) => isId(s.id))) {
    return { error: "Nothing to restore." };
  }
  const accountIds = [...new Set(snapshots.flatMap((s) => [s.accountId, s.toAccountId].filter((v): v is string => !!v)))];
  const categoryIds = [...new Set(snapshots.map((s) => s.categoryId).filter((v): v is string => !!v))];
  const cardIds = [...new Set(snapshots.map((s) => s.cardId).filter((v): v is string => !!v))];
  const tagIds = [...new Set(snapshots.flatMap((s) => s.tagIds))];
  const [accounts, categories, cards, tags] = await Promise.all([
    run(db().from("Account").select("id").eq("userId", userId).in("id", accountIds)),
    categoryIds.length ? run(db().from("Category").select("id").eq("userId", userId).in("id", categoryIds)) : [],
    cardIds.length ? run(db().from("Card").select("id").eq("userId", userId).in("id", cardIds)) : [],
    tagIds.length ? run(db().from("Tag").select("id").eq("userId", userId).in("id", tagIds)) : [],
  ]);
  const have = (list: { id: string }[]) => new Set(list.map((x) => x.id));
  const okAccounts = have(accounts);
  if (!accountIds.every((id) => okAccounts.has(id))) {
    return { error: "An account used by these transactions no longer exists." };
  }
  const okCategories = have(categories);
  const okCards = have(cards);
  const okTags = have(tags);

  const { error } = await db().from("Transaction").insert(
    snapshots.map((s) => ({
      id: s.id,
      userId,
      type: s.type,
      amount: s.amount,
      toAmount: s.toAmount,
      accountId: s.accountId,
      toAccountId: s.toAccountId,
      // A category or card deleted in the meantime just comes back without it.
      categoryId: s.categoryId && okCategories.has(s.categoryId) ? s.categoryId : null,
      cardId: s.cardId && okCards.has(s.cardId) ? s.cardId : null,
      date: s.date,
      note: s.note,
      createdAt: s.createdAt,
    })),
  );
  if (error) {
    return { error: "These transactions were already restored." };
  }
  const links = snapshots.flatMap((s) => s.tagIds.filter((t) => okTags.has(t)).map((tagId) => ({ transactionId: s.id, tagId })));
  if (links.length > 0) {
    await run(db().from("TransactionTag").insert(links));
  }
  revalidatePath("/", "layout");
  return { ok: true, message: snapshots.length === 1 ? "Transaction restored" : `${snapshots.length} transactions restored` };
}

/** Sets (or, with an empty id, clears) the category of several transactions at once. Transfers are skipped. */
export async function setTransactionsCategory(ids: string[], categoryId: string): Promise<ActionState> {
  const userId = await requireUserId();
  const clean = [...new Set(ids)].filter(isId);
  if (clean.length === 0 || clean.length > 500) {
    return { error: "Choose the transactions to change." };
  }
  if (categoryId && !isId(categoryId)) {
    return { error: "Category not found." };
  }
  const category = categoryId
    ? await run(db().from("Category").select("id, name, type").eq("id", categoryId).eq("userId", userId).maybeSingle())
    : null;
  if (categoryId && !category) {
    return { error: "Category not found." };
  }
  // A category only fits transactions of its own type.
  let query = db().from("Transaction").update({ categoryId: category?.id ?? null }).eq("userId", userId).in("id", clean).neq("type", "TRANSFER");
  if (category) query = query.eq("type", category.type);
  const updated = await run(query.select("id"));
  revalidatePath("/", "layout");
  const skipped = clean.length - updated.length;
  return {
    ok: true,
    message: `${updated.length} ${updated.length === 1 ? "transaction" : "transactions"} updated`,
    detail: skipped > 0 ? `${skipped} skipped: a transfer or a different type.` : category?.name,
  };
}

const splitSchema = z.object({
  id: z.string().min(1),
  parts: z
    .array(z.object({ amount: z.number().int().positive(), categoryId: z.string(), note: z.string().max(500) }))
    .min(2, "Add at least two parts")
    .max(20),
});

/** Replaces one income or expense with several parts that add up to the same amount. */
export async function splitTransaction(input: { id: string; parts: { amount: number; categoryId: string; note: string }[] }): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = splitSchema.safeParse(input);
  if (!parsed.success || !isId(parsed.data.id)) {
    return { error: parsed.success ? "Transaction not found." : (parsed.error.issues[0]?.message ?? "Check the parts.") };
  }
  const { id, parts } = parsed.data;

  const tx = await run(db().from("Transaction").select("type, amount").eq("id", id).eq("userId", userId).maybeSingle());
  if (!tx) return { error: "Transaction not found." };
  if (tx.type === "TRANSFER") return { error: "A transfer cannot be split." };
  if (parts.reduce((sum, p) => sum + p.amount, 0) !== tx.amount) {
    return { error: "The parts must add up to the full amount." };
  }
  const categoryIds = [...new Set(parts.map((p) => p.categoryId).filter(Boolean))];
  if (categoryIds.some((c) => !isId(c))) return { error: "Category not found." };
  if (categoryIds.length > 0) {
    const found = await run(db().from("Category").select("id").eq("userId", userId).eq("type", tx.type).in("id", categoryIds));
    if (found.length !== categoryIds.length) return { error: "Choose categories of the same type." };
  }

  const { error } = await db().rpc("split_transaction", { p_user_id: userId, p_id: id, p_parts: parts });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaction split", detail: `${parts.length} parts` };
}

export type SimilarTransaction = { id: string; day: string; note: string; category: string | null };

/**
 * Transactions that look like the one being added: same account, type and amount, within a day.
 * Used to warn before the same SMS or receipt is added twice.
 */
export async function findSimilar(input: { type: string; amount: number; accountId: string; day: string; excludeId?: string }): Promise<SimilarTransaction[]> {
  const userId = await requireUserId();
  if (!isId(input.accountId) || !/^\d{4}-\d{2}-\d{2}$/.test(input.day) || !(input.amount > 0)) return [];
  if (!(Constants.public.Enums.TransactionType as readonly string[]).includes(input.type)) return [];
  const around = dayToDate(input.day).getTime();
  let query = db()
    .from("Transaction")
    .select("id, date, note, category:Category(name)")
    .eq("userId", userId)
    .eq("accountId", input.accountId)
    .eq("type", input.type as "INCOME" | "EXPENSE" | "TRANSFER")
    .eq("amount", input.amount)
    .gte("date", new Date(around - 36 * 3_600_000).toISOString())
    .lte("date", new Date(around + 36 * 3_600_000).toISOString())
    .limit(3);
  if (input.excludeId && isId(input.excludeId)) query = query.neq("id", input.excludeId);
  const rows = await run(query);
  return rows.map((r) => ({ id: r.id, day: r.date.slice(0, 10), note: r.note, category: r.category?.name ?? null }));
}
