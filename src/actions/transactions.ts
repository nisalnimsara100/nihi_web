"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayToDate } from "@/lib/dates";
import { parseAmount } from "@/lib/money";
import { TransactionType } from "@/generated/prisma/enums";
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
    type: z.enum(TransactionType),
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
    db.account.findMany({ where: { id: { in: accountIds }, userId }, select: { id: true, currency: true } }),
    !isTransfer && data.categoryId
      ? db.category.findFirst({ where: { id: data.categoryId, userId, type: data.type as "INCOME" | "EXPENSE" } })
      : null,
    db.tag.findMany({ where: { id: { in: tagIds }, userId }, select: { id: true } }),
  ]);
  if (accounts.length !== accountIds.length) {
    return { error: "Account not found." };
  }
  if (!isTransfer && data.categoryId && !category) {
    return { fieldErrors: { categoryId: ["Choose a category of the same type"] } };
  }

  const amount = data.amount!;
  const fields = {
    type: data.type,
    amount,
    accountId: data.accountId,
    toAccountId: isTransfer ? data.toAccountId! : null,
    toAmount: isTransfer ? (data.toAmount ?? amount) : null,
    categoryId: isTransfer ? null : (category?.id ?? null),
    date: dayToDate(data.date),
    note: data.note,
  };

  if (data.id) {
    const existing = await db.transaction.findFirst({ where: { id: data.id, userId }, select: { id: true } });
    if (!existing) {
      return { error: "Transaction not found." };
    }
    await db.transaction.update({
      where: { id: data.id },
      data: { ...fields, tags: { set: tags.map((t) => ({ id: t.id })) } },
    });
  } else {
    await db.transaction.create({
      data: { ...fields, userId, tags: { connect: tags.map((t) => ({ id: t.id })) } },
    });
  }

  revalidatePath("/", "layout");
  redirect("/transactions");
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const { count } = await db.transaction.deleteMany({ where: { id, userId } });
  if (count === 0) {
    return { error: "Transaction not found." };
  }
  revalidatePath("/", "layout");
  redirect("/transactions");
}
