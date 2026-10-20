"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { CURRENCIES } from "@/lib/constants";
import { db, isId, run } from "@/lib/db";
import { formatMoney, parseAmount } from "@/lib/money";
import { fromZodError, type ActionState } from "./state";

const MAX_MINOR = 2_147_483_647;

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Enter a name").max(60),
  currency: z.enum(CURRENCIES),
  targetAmount: z.string().transform((v, ctx) => {
    const amount = parseAmount(v);
    if (amount === null || amount <= 0 || amount > MAX_MINOR) {
      ctx.addIssue({ code: "custom", message: "Enter the amount you want to reach" });
      return z.NEVER;
    }
    return amount;
  }),
  targetDate: z.string().optional(),
  // A savings account to follow, or empty to track the amount by hand.
  accountId: z.string().optional(),
});

/** Creates or updates a savings goal. */
export async function saveGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { id, accountId, targetDate, ...rest } = parsed.data;
  if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return { fieldErrors: { targetDate: ["Choose a valid date"] } };
  }

  let linked: string | null = null;
  if (accountId) {
    if (!isId(accountId)) return { error: "Account not found." };
    const account = await run(db().from("Account").select("id, currency").eq("id", accountId).eq("userId", userId).maybeSingle());
    if (!account) return { error: "Account not found." };
    if (account.currency !== rest.currency) return { fieldErrors: { accountId: [`That account uses ${account.currency}`] } };
    linked = account.id;
  }
  const row = { ...rest, targetDate: targetDate || null, accountId: linked };

  if (id) {
    if (!isId(id)) return { error: "Goal not found." };
    const updated = await run(db().from("SavingsGoal").update(row).eq("id", id).eq("userId", userId).select("id"));
    if (updated.length === 0) return { error: "Goal not found." };
  } else {
    await run(db().from("SavingsGoal").insert({ ...row, userId }));
  }
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Goal updated" : "Goal added", detail: rest.name };
}

export async function deleteGoal(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!isId(id)) return { error: "Goal not found." };
  const deleted = await run(db().from("SavingsGoal").delete().eq("id", id).eq("userId", userId).select("name"));
  if (deleted.length === 0) return { error: "Goal not found." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Goal deleted", detail: deleted[0].name };
}

/** Adds money to (or, with a minus, takes money from) a goal that is tracked by hand. */
export async function addToGoal(id: string, amount: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!isId(id)) return { error: "Goal not found." };
  const change = parseAmount(amount);
  if (change === null || change === 0) return { error: "Enter an amount, like 5000 (a minus takes money out)." };
  const goal = await run(db().from("SavingsGoal").select("savedAmount, currency, accountId, name").eq("id", id).eq("userId", userId).maybeSingle());
  if (!goal) return { error: "Goal not found." };
  if (goal.accountId) return { error: "This goal follows a savings account. Move money in that account instead." };
  const next = Math.min(MAX_MINOR, Math.max(0, goal.savedAmount + change));
  await run(db().from("SavingsGoal").update({ savedAmount: next }).eq("id", id).eq("userId", userId).select("id"));
  revalidatePath("/", "layout");
  return { ok: true, message: change > 0 ? "Added to goal" : "Taken from goal", detail: `${goal.name}: ${formatMoney(next, goal.currency)} saved` };
}
