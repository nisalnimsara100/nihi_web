"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { CATEGORY_ICON_NAMES, DEFAULT_CATEGORY_ICON, isCategoryIcon } from "@/lib/category-icons";
import { Constants } from "@/lib/database.types";
import { db, run } from "@/lib/db";
import { fromZodError, type ActionState } from "./state";

const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a color");

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Enter a name").max(40),
  type: z.enum(Constants.public.Enums.CategoryType),
  color,
  icon: z
    .string()
    .default(DEFAULT_CATEGORY_ICON)
    .refine(isCategoryIcon, { message: `Pick one of: ${CATEGORY_ICON_NAMES.join(", ")}` }),
});

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }
  const { id, ...data } = parsed.data;

  let clashQuery = db().from("Category").select("id").eq("userId", userId).eq("type", data.type).eq("name", data.name);
  if (id) clashQuery = clashQuery.neq("id", id);
  if ((await run(clashQuery.limit(1))).length > 0) {
    return { fieldErrors: { name: ["A category with this name already exists"] } };
  }

  if (id) {
    // Type is fixed after creation so existing transactions stay consistent.
    const updated = await run(
      db()
        .from("Category")
        .update({ name: data.name, color: data.color, icon: data.icon })
        .eq("id", id)
        .eq("userId", userId)
        .select("id"),
    );
    if (updated.length === 0) return { error: "Category not found." };
  } else {
    await run(db().from("Category").insert({ ...data, userId }));
  }

  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Category updated" : "Category added", detail: data.name };
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const deleted = await run(db().from("Category").delete().eq("id", id).eq("userId", userId).select("name"));
  revalidatePath("/", "layout");
  return { ok: true, message: "Category deleted", detail: deleted[0]?.name };
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

  let clashQuery = db().from("Tag").select("id").eq("userId", userId).eq("name", data.name);
  if (id) clashQuery = clashQuery.neq("id", id);
  if ((await run(clashQuery.limit(1))).length > 0) {
    return { fieldErrors: { name: ["A tag with this name already exists"] } };
  }

  if (id) {
    const updated = await run(db().from("Tag").update(data).eq("id", id).eq("userId", userId).select("id"));
    if (updated.length === 0) return { error: "Tag not found." };
  } else {
    await run(db().from("Tag").insert({ ...data, userId }));
  }

  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Tag updated" : "Tag added", detail: data.name };
}

export async function deleteTag(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  const deleted = await run(db().from("Tag").delete().eq("id", id).eq("userId", userId).select("name"));
  revalidatePath("/", "layout");
  return { ok: true, message: "Tag deleted", detail: deleted[0]?.name };
}
