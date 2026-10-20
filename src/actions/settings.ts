"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { CURRENCIES } from "@/lib/constants";
import { db, run } from "@/lib/db";
import { fromZodError, type ActionState } from "./state";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(60),
  defaultCurrency: z.enum(CURRENCIES),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  await run(db().from("User").update(parsed.data).eq("id", userId));
  revalidatePath("/", "layout");
  return { ok: true };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "Use at least 8 characters").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const user = await run(db().from("User").select("passwordHash").eq("id", userId).single());
  if (!(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    return { fieldErrors: { current: ["Current password is incorrect"] } };
  }
  await run(
    db()
      .from("User")
      .update({ passwordHash: await bcrypt.hash(parsed.data.next, 10) })
      .eq("id", userId),
  );
  return { ok: true };
}
