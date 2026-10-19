"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CURRENCIES, DEFAULT_CATEGORIES, COLORS } from "@/lib/constants";
import { db } from "@/lib/db";
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

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { fieldErrors: { email: ["An account with this email already exists"] } };
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      defaultCurrency: currency,
      categories: { create: DEFAULT_CATEGORIES },
      accounts: { create: { name: "Cash", type: "CASH", currency, color: COLORS[2] } },
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
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

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
