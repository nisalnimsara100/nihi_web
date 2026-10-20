/**
 * Translation. The English text is the key: `t("Add transaction")` returns the Sinhala for it, or the
 * English itself when nothing is translated yet, so the app is never blank. Text with a variable part
 * uses a placeholder, `t("{count} accounts", { count })`, and the dictionary has the same placeholder.
 */
export const LANGS = [
  { value: "en", label: "English" },
  { value: "si", label: "සිංහල" },
] as const;

export type Lang = (typeof LANGS)[number]["value"];

export const LANG_COOKIE = "nihi_lang";

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "si";
}

export type Vars = Record<string, string | number>;
export type Dictionary = Record<string, string>;

export function interpolate(text: string, vars?: Vars) {
  return vars ? text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match)) : text;
}

export function translate(dictionary: Dictionary | null, text: string, vars?: Vars) {
  return interpolate(dictionary?.[text] ?? text, vars);
}

export type TFunction = (text: string, vars?: Vars) => string;
