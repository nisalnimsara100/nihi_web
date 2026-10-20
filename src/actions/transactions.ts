"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { Constants, type Database } from "@/lib/database.types";
import { db, run } from "@/lib/db";
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

export async function saveTransaction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const data = parsed.data;
  const isTransfer = data.type === "TRANSFER";
  const tagIds = formData.getAll("tags").map(String);

  // Every referenced record must belong to this user.
  const accountIds = [data.accountId, ...(isTransfer && data.toAccountId ? [data.toAccountId] : [])];
  const [accounts, category, tags] = await Promise.all([
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
  ]);
  if (accounts.length !== accountIds.length) {
    return { error: "Account not found." };
  }
  if (!isTransfer && data.categoryId && !category) {
    return { fieldErrors: { categoryId: ["Choose a category of the same type"] } };
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
  };

  // Generated types mark every function argument as required and non-null,
  // but save_transaction takes null for a new transaction and for unused fields.
  const savedId = await run(
    db().rpc("save_transaction", args as Database["public"]["Functions"]["save_transaction"]["Args"]),
  );
  if (!savedId) {
    return { error: "Transaction not found." };
  }

  const currency = accounts.find((a) => a.id === data.accountId)?.currency ?? "LKR";
  const kind = { INCOME: "Income", EXPENSE: "Expense", TRANSFER: "Transfer" }[data.type];
  await flash({
    type: "success",
    title: data.id ? "Transaction updated" : "Transaction added",
    description: `${kind} · ${formatMoney(amount, currency)}`,
  });

  revalidatePath("/", "layout");
  redirect("/transactions");
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const deleted = await run(db().from("Transaction").delete().eq("id", id).eq("userId", userId).select("id"));
  if (deleted.length === 0) {
    return { error: "Transaction not found." };
  }
  await flash({ type: "success", title: "Transaction deleted" });
  revalidatePath("/", "layout");
  redirect("/transactions");
}
