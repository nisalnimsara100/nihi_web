"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { isValidTheme } from "@/lib/card-themes";
import { CURRENCIES } from "@/lib/constants";
import { flash } from "@/lib/flash";
import { db, isId, run } from "@/lib/db";
import { parseAmount } from "@/lib/money";
import { Constants } from "@/lib/database.types";
import { fromZodError, type ActionState } from "./state";

/** Optional money field: empty means "not set", otherwise a non-negative amount in minor units. */
const optionalMoney = (label: string) =>
  z
    .string()
    .default("")
    .transform((v, ctx) => {
      if (!v.trim()) return null;
      const amount = parseAmount(v);
      if (amount === null || amount < 0) {
        ctx.addIssue({ code: "custom", message: `Enter a valid ${label}` });
        return z.NEVER;
      }
      return amount;
    });

/** Optional whole number in a range, like a day of the month. */
const optionalInt = (label: string, min: number, max: number) =>
  z
    .string()
    .default("")
    .transform((v, ctx) => {
      if (!v.trim()) return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `${label} must be ${min} to ${max}` });
        return z.NEVER;
      }
      return n;
    });

/** Optional percentage with up to two decimals. */
const optionalPercent = (label: string) =>
  z
    .string()
    .default("")
    .transform((v, ctx) => {
      if (!v.trim()) return null;
      const n = Number(v.replace(/%/g, "").trim());
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        ctx.addIssue({ code: "custom", message: `${label} must be 0 to 100` });
        return z.NEVER;
      }
      return Math.round(n * 100) / 100;
    });

const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Enter a name").max(60),
  type: z.enum(Constants.public.Enums.AccountType),
  currency: z.enum(CURRENCIES),
  initialBalance: z
    .string()
    .transform((v, ctx) => {
      const amount = parseAmount(v || "0");
      if (amount === null) {
        ctx.addIssue({ code: "custom", message: "Enter a valid amount" });
        return z.NEVER;
      }
      return amount;
    }),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a color"),
  theme: z.string().refine(isValidTheme, "Pick a card theme"),
  note: z.string().trim().max(200).default(""),
  // Credit card terms. Only kept for credit card accounts.
  creditLimit: optionalMoney("credit limit"),
  statementDay: optionalInt("Statement day", 1, 31),
  dueDay: optionalInt("Payment due day", 1, 31),
  interestRate: optionalPercent("Interest rate"),
  annualFee: optionalMoney("annual fee"),
  lateFee: optionalMoney("late fee"),
  minPaymentPercent: optionalPercent("Minimum payment"),
  minPaymentFloor: optionalMoney("minimum payment amount"),
  archived: z.literal("on").optional(),
});

export async function saveAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { id, archived, minPaymentPercent, minPaymentFloor, ...rest } = parsed.data;
  // Credit terms belong to credit cards; switching an account to another type clears them.
  const isCredit = rest.type === "CREDIT_CARD";
  const data = {
    ...rest,
    creditLimit: isCredit ? rest.creditLimit : null,
    statementDay: isCredit ? rest.statementDay : null,
    dueDay: isCredit ? rest.dueDay : null,
    interestRate: isCredit ? rest.interestRate : null,
    annualFee: isCredit ? rest.annualFee : null,
    lateFee: isCredit ? rest.lateFee : null,
    minPaymentPercent: minPaymentPercent ?? 5,
    minPaymentFloor: minPaymentFloor ?? 50000,
  };

  if (id) {
    const updated = await run(
      db().from("Account").update({ ...data, archived: archived === "on" }).eq("id", id).eq("userId", userId).select("id"),
    );
    if (updated.length === 0) {
      return { error: "Account not found." };
    }
  } else {
    await run(db().from("Account").insert({ ...data, userId }));
  }

  await flash({ type: "success", title: id ? "Account updated" : "Account added", description: data.name });

  revalidatePath("/", "layout");
  redirect("/accounts");
}

export async function deleteAccount(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!isId(id)) {
    return { error: "Account not found." };
  }
  const { count, error } = await db()
    .from("Transaction")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .or(`accountId.eq.${id},toAccountId.eq.${id}`);
  if (error) {
    throw new Error(error.message);
  }
  if (count) {
    return { error: "This account has transactions. Archive it instead, or delete its transactions first." };
  }

  const deleted = await run(db().from("Account").delete().eq("id", id).eq("userId", userId).select("name"));
  if (deleted.length === 0) {
    return { error: "Account not found." };
  }
  await flash({ type: "success", title: "Account deleted", description: deleted[0].name });
  revalidatePath("/", "layout");
  redirect("/accounts");
}
