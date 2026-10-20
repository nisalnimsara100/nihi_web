"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { CARD_NETWORK_VALUES, networkLabel } from "@/lib/card-networks";
import { db, isId, run, UNIQUE_VIOLATION } from "@/lib/db";
import { fromZodError, type ActionState } from "./state";

const cardSchema = z.object({
  accountId: z.string().min(1),
  last4: z.string().trim().regex(/^\d{4}$/, "Enter the last 4 digits of the card"),
  network: z.enum(CARD_NETWORK_VALUES, "Pick the card type"),
  name: z.string().trim().max(40).default(""),
});

/** Links a card (by its last 4 digits) to one of the user's accounts. */
export async function addCard(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { accountId, last4, network, name } = parsed.data;
  if (!isId(accountId)) {
    return { error: "Account not found." };
  }

  const owned = await run(db().from("Account").select("id").eq("id", accountId).eq("userId", userId).limit(1));
  if (owned.length === 0) {
    return { error: "Account not found." };
  }

  const { error } = await db().from("Card").insert({ userId, accountId, last4, network, name });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { fieldErrors: { last4: ["This card is already linked to this account"] } };
    }
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Card linked", detail: `${networkLabel(network)} •••• ${last4}` };
}

export async function deleteCard(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!isId(id)) {
    return { error: "Card not found." };
  }
  const deleted = await run(db().from("Card").delete().eq("id", id).eq("userId", userId).select("last4"));
  if (deleted.length === 0) {
    return { error: "Card not found." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Card removed", detail: `•••• ${deleted[0].last4}` };
}
