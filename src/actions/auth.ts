"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CURRENCIES, DEFAULT_CATEGORIES, COLORS } from "@/lib/constants";
import { db, run, UNIQUE_VIOLATION } from "@/lib/db";
import { isBlockedDemo } from "@/lib/demo";
import { flash } from "@/lib/flash";
import { safeNext } from "@/lib/next-path";
import { createSession, deleteSession } from "@/lib/session";
import { fromZodError, type ActionState } from "./state";

const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(60),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(8, "Use at least 8 characters").max(200),
  currency: z.enum(CURRENCIES),
});

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { name, email, password, currency } = parsed.data;

  if (isBlockedDemo(email)) {
    return { fieldErrors: { email: ["An account with this email already exists"] } };
  }

  const { data: user, error } = await db()
    .from("User")
    .insert({ name, email, passwordHash: await bcrypt.hash(password, 10), defaultCurrency: currency })
    .select("id")
    .single();
  if (error?.code === UNIQUE_VIOLATION) {
    return { fieldErrors: { email: ["An account with this email already exists"] } };
  }
  if (error) {
    throw new Error(error.message);
  }

  try {
    await Promise.all([
      run(db().from("Category").insert(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id })))),
      run(db().from("Account").insert({ userId: user.id, name: "Cash", type: "CASH", currency, color: COLORS[2] })),
    ]);
  } catch (setupError) {
    // Don't leave a half-created account behind; the user can sign up again.
    await db().from("User").delete().eq("id", user.id);
    throw setupError;
  }

  await createSession(user.id);
  await flash({
    type: "success",
    title: `Welcome to NiHi, ${name.split(/\s+/)[0]}`,
    description: "Your Cash account and default categories are ready.",
  });
  redirect(safeNext(formData.get("next")));
}

const loginSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
});

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { email, password } = parsed.data;

  const user = await run(db().from("User").select("id, name, passwordHash").eq("email", email).maybeSingle());
  if (isBlockedDemo(email) || !user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }

  await createSession(user.id);
  await flash({ type: "success", title: `Welcome back, ${user.name.split(/\s+/)[0]}` });
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await deleteSession();
  await flash({ type: "info", title: "Signed out", description: "See you soon." });
  redirect("/login");
}
