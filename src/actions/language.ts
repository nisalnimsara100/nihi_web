"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLang, LANG_COOKIE } from "@/lib/i18n/translate";

/** Remembers the language on this device for a year. It needs no account, so it also works on the sign-in page. */
export async function setLanguage(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
