"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { CategoryType } from "@/generated/prisma/enums";
import { fromZodError, type ActionState } from "./state";

const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a color");

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Enter a name").max(40),
  type: z.enum(CategoryType),
  color,
});

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { id, ...data } = parsed.data;

  const clash = await db.category.findFirst({
    where: { userId, type: data.type, name: data.name, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) {
    return { fieldErrors: { name: ["A category with this name already exists"] } };
  }

  if (id) {
    // Type is fixed after creation so existing transactions stay consistent.
    const { count } = await db.category.updateMany({
      where: { id, userId },
      data: { name: data.name, color: data.color },
    });
    if (count === 0) return { error: "Category not found." };
  } else {
    await db.category.create({ data: { ...data, userId } });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  await db.category.deleteMany({ where: { id, userId } });
  revalidatePath("/", "layout");
  return { ok: true };
}

const tagSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Enter a name").max(30),
  color,
});

export async function saveTag(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = tagSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { id, ...data } = parsed.data;

  const clash = await db.tag.findFirst({
    where: { userId, name: data.name, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (clash) {
    return { fieldErrors: { name: ["A tag with this name already exists"] } };
  }

  if (id) {
    const { count } = await db.tag.updateMany({ where: { id, userId }, data });
    if (count === 0) return { error: "Tag not found." };
  } else {
    await db.tag.create({ data: { ...data, userId } });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTag(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  await db.tag.deleteMany({ where: { id, userId } });
  revalidatePath("/", "layout");
  return { ok: true };
}
