import "server-only";
import { cookies } from "next/headers";
import { si } from "./si";
import { isLang, LANG_COOKIE, translate, type Lang, type TFunction } from "./translate";

/** The language chosen on this device, from its cookie. English when none is set. */
export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : "en";
}

/** Translator for server components: `const t = await getT()`. */
export async function getT(): Promise<TFunction> {
  const lang = await getLang();
  return (text, vars) => translate(lang === "si" ? si : null, text, vars);
}
