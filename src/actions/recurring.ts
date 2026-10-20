"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { Constants, type Database } from "@/lib/database.types";
import { db, isId, run } from "@/lib/db";
import { dayToDate } from "@/lib/dates";
import { flash } from "@/lib/flash";
import { formatMoney, parseAmount } from "@/lib/money";
import { advance, type Frequency } from "@/lib/recurring";
import { fromZodError, type ActionState } from "./state";

const amountField = z.string().transform((v, ctx) => {
  const amount = parseAmount(v);
  if (amount === null || amount <= 0) {
    ctx.addIssue({ code: "custom", message: "Enter an amount greater than 0" });
    return z.NEVER;
  }
  return amount;
});

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

const schema = z
  .object({
    id: z.string().optional(),
    type: z.enum(Constants.public.Enums.TransactionType),
    amount: amountField,
    accountId: z.string().min(1, "Choose an account"),
    toAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    note: z.string().trim().max(200).default(""),
    frequency: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
    nextDate: day,
    endDate: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "TRANSFER") {
      if (!d.toAccountId) ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Choose where the money goes" });
      else if (d.toAccountId === d.accountId) ctx.addIssue({ code: "custom", path: ["toAccountId"], message: "Pick a different account" });
    }
    if (d.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(d.endDate)) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Choose a valid end date" });
    if (d.endDate && d.endDate < d.nextDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: "The end date is before the first date" });
  });

/** Creates or updates a repeating transaction. */
export async function saveRecurring(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const d = parsed.data;
  const isTransfer = d.type === "TRANSFER";

  const accountIds = [d.accountId, ...(isTransfer && d.toAccountId ? [d.toAccountId] : [])];
  const [accounts, category] = await Promise.all([
    run(db().from("Account").select("id").in("id", accountIds).eq("userId", userId)),
    !isTransfer && d.categoryId
      ? run(db().from("Category").select("id").eq("id", d.categoryId).eq("userId", userId).eq("type", d.type as "INCOME" | "EXPENSE").maybeSingle())
      : null,
  ]);
  if (accounts.length !== accountIds.length) return { error: "Account not found." };
  if (!isTransfer && d.categoryId && !category) return { fieldErrors: { categoryId: ["Choose a category of the same type"] } };

  const row = {
    type: d.type,
    amount: d.amount,
    toAmount: null,
    accountId: d.accountId,
    toAccountId: isTransfer ? d.toAccountId! : null,
    categoryId: isTransfer ? null : (category?.id ?? null),
    note: d.note,
    frequency: d.frequency,
    anchorDay: Number(d.nextDate.slice(8, 10)),
    nextDate: d.nextDate,
    endDate: d.endDate || null,
    active: true,
  };

  if (d.id) {
    if (!isId(d.id)) return { error: "Repeating transaction not found." };
    const updated = await run(db().from("Recurring").update(row).eq("id", d.id).eq("userId", userId).select("id"));
    if (updated.length === 0) return { error: "Repeating transaction not found." };
  } else {
    await run(db().from("Recurring").insert({ ...row, userId }));
  }

  await flash({ type: "success", title: d.id ? "Repeat updated" : "Repeat added", description: d.note || undefined });
  revalidatePath("/", "layout");
  redirect("/recurring");
}

export async function deleteRecurring(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!isId(id)) return { error: "Repeating transaction not found." };
  const deleted = await run(db().from("Recurring").delete().eq("id", id).eq("userId", userId).select("id"));
  if (deleted.length === 0) return { error: "Repeating transaction not found." };
  await flash({ type: "success", title: "Repeat deleted", description: "Transactions already added are kept." });
  revalidatePath("/", "layout");
  redirect("/recurring");
}

/** Pauses or resumes a rule. Resuming keeps its date; use Skip to move past old dates. */
export async function setRecurringActive(id: string, active: boolean): Promise<ActionState> {
  const userId = await requireUserId();
  if (!isId(id)) return { error: "Repeating transaction not found." };
  const updated = await run(db().from("Recurring").update({ active }).eq("id", id).eq("userId", userId).select("id"));
  if (updated.length === 0) return { error: "Repeating transaction not found." };
  revalidatePath("/", "layout");
  return { ok: true, message: active ? "Repeat resumed" : "Repeat paused" };
}

/**
 * Moves a rule on to its next date. The move happens first, only if the date is still the one the
 * user saw, so pressing Add twice (or from two devices) can't add the same occurrence twice.
 */
async function claimOccurrence(userId: string, id: string) {
  if (!isId(id)) return null;
  const rule = await run(db().from("Recurring").select("*").eq("id", id).eq("userId", userId).eq("active", true).maybeSingle());
  if (!rule) return null;
  const next = advance(rule.nextDate, rule.frequency as Frequency, rule.anchorDay, rule.endDate);
  const moved = await run(
    db()
      .from("Recurring")
      .update(next ? { nextDate: next } : { active: false })
      .eq("id", id)
      .eq("userId", userId)
      .eq("nextDate", rule.nextDate)
      .select("id"),
  );
  return moved.length > 0 ? { rule, next } : null;
}

/** Adds the waiting occurrence as a real transaction, dated on the day it was due. */
export async function confirmRecurring(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const claimed = await claimOccurrence(userId, id);
  if (!claimed) return { error: "This was already handled." };
  const { rule } = claimed;

  const args = {
    p_user_id: userId,
    p_id: null,
    p_type: rule.type,
    p_amount: rule.amount,
    p_account_id: rule.accountId,
    p_to_account_id: rule.toAccountId,
    p_to_amount: rule.type === "TRANSFER" ? (rule.toAmount ?? rule.amount) : null,
    p_category_id: rule.categoryId,
    p_date: dayToDate(rule.nextDate).toISOString(),
    p_note: rule.note,
    p_tag_ids: [],
    p_card_id: null,
  };
  const { error } = await db().rpc("save_transaction", args as unknown as Database["public"]["Functions"]["save_transaction"]["Args"]);
  if (error) {
    // Put the rule back so the occurrence is not lost.
    await db().from("Recurring").update({ nextDate: rule.nextDate, active: true }).eq("id", id).eq("userId", userId);
    throw new Error(error.message);
  }

  const account = await run(db().from("Account").select("currency").eq("id", rule.accountId).maybeSingle());
  revalidatePath("/", "layout");
  return { ok: true, message: "Added", detail: `${rule.note || "Repeating transaction"} · ${formatMoney(rule.amount, account?.currency ?? "LKR")}` };
}

/** Skips the waiting occurrence without adding anything. */
export async function skipRecurring(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const claimed = await claimOccurrence(userId, id);
  if (!claimed) return { error: "This was already handled." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Skipped", detail: claimed.rule.note || undefined };
}
