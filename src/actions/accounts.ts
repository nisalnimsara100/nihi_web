"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { CURRENCIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { parseAmount } from "@/lib/money";
import { AccountType } from "@/generated/prisma/enums";
import { fromZodError, type ActionState } from "./state";

const accountSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Enter a name").max(60),
  type: z.enum(AccountType),
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
    const existing = await db.account.findFirst({ where: { id, userId }, select: { id: true } });
    if (!existing) {
      return { error: "Account not found." };
    }
    await db.account.update({ where: { id }, data: { ...data, archived: archived === "on" } });
  } else {
    await db.account.create({ data: { ...data, userId } });
  }

  revalidatePath("/", "layout");
  redirect("/accounts");
}

export async function deleteAccount(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const account = await db.account.findFirst({
    where: { id, userId },
    include: { _count: { select: { transactions: true, incomingTransfers: true } } },
  });
  if (!account) {
    return { error: "Account not found." };
  }
  if (account._count.transactions + account._count.incomingTransfers > 0) {
    return { error: "This account has transactions. Archive it instead, or delete its transactions first." };
  }

  await db.account.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/accounts");
}
