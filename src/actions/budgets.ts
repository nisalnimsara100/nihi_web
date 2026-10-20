"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { CURRENCIES } from "@/lib/constants";
import { db, isId, run } from "@/lib/db";
import { parseAmount } from "@/lib/money";
import { fromZodError, type ActionState } from "./state";

const schema = z.object({
  categoryId: z.string().min(1),
  currency: z.enum(CURRENCIES),
  // Empty or zero removes the budget.
  amount: z.string().default(""),
});

/** Sets, changes or (with an empty amount) removes the monthly limit of one expense category. */
export async function saveBudget(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { categoryId, currency, amount: raw } = parsed.data;
  if (!isId(categoryId)) {
    return { error: "Category not found." };
  }

  const category = await run(
    db().from("Category").select("id, name").eq("id", categoryId).eq("userId", userId).eq("type", "EXPENSE").maybeSingle(),
  );
  if (!category) {
    return { error: "Choose an expense category." };
  }

  const amount = raw.trim() ? parseAmount(raw) : 0;
  if (amount === null || amount < 0) {
    return { fieldErrors: { amount: ["Enter a valid amount"] } };
  }

  if (amount === 0) {
    await run(db().from("Budget").delete().eq("userId", userId).eq("categoryId", categoryId).eq("currency", currency).select("id"));
    revalidatePath("/", "layout");
    return { ok: true, message: "Budget removed", detail: category.name };
  }

  await run(
    db().from("Budget").upsert({ userId, categoryId, currency, amount }, { onConflict: "userId,categoryId,currency" }),
  );
  revalidatePath("/", "layout");
  return { ok: true, message: "Budget saved", detail: category.name };
}
