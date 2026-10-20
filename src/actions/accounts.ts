"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { CURRENCIES } from "@/lib/constants";
import { db, isId, run } from "@/lib/db";
import { parseAmount } from "@/lib/money";
import { Constants } from "@/lib/database.types";
import { fromZodError, type ActionState } from "./state";

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
  note: z.string().trim().max(200).default(""),
  archived: z.literal("on").optional(),
});

export async function saveAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { id, archived, ...data } = parsed.data;

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

  const deleted = await run(db().from("Account").delete().eq("id", id).eq("userId", userId).select("id"));
  if (deleted.length === 0) {
    return { error: "Account not found." };
  }
  revalidatePath("/", "layout");
  redirect("/accounts");
}
