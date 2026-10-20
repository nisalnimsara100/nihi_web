import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

/**
 * A one-time message for the next page. Server Actions that redirect (adding
 * an account, signing in...) can't return a result to the form, so they leave
 * it in a short-lived cookie. The root layout reads it and shows it as a toast.
 * Not httpOnly: the browser clears it once shown. Never put secrets in it.
 */
export type Flash = {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
};

export const FLASH_COOKIE = "nihi_flash";

export async function flash(message: Omit<Flash, "id">) {
  (await cookies()).set(FLASH_COOKIE, JSON.stringify({ ...message, id: randomUUID() }), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function readFlash(): Promise<Flash | null> {
  const raw = (await cookies()).get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Flash>;
    const types = ["success", "error", "info", "warning"];
    if (typeof value.id !== "string" || typeof value.title !== "string" || !types.includes(value.type ?? "")) {
      return null;
    }
    return {
      id: value.id,
      type: value.type as Flash["type"],
      title: value.title,
      description: typeof value.description === "string" ? value.description : undefined,
    };
  } catch {
    return null;
  }
}
