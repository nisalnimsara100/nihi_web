"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { si } from "./si";
import { translate, type Lang, type TFunction, type Vars } from "./translate";

const LangContext = createContext<Lang>("en");

// Browser only. Never read this on the server: one server process serves many people at once.
let currentLang: Lang = "en";

/** Provides the language to client components. The server reads it from the cookie and passes it down. */
export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  // Toasts are raised from event handlers, outside React, so they read the language from a variable.
  useEffect(() => {
    currentLang = lang;
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** Translator for client components: `const t = useT()`. */
export function useT(): TFunction {
  const lang = useLang();
  return useMemo<TFunction>(() => (text: string, vars?: Vars) => translate(lang === "si" ? si : null, text, vars), [lang]);
}

/** Translates outside React (toasts). Only call from the browser. */
export function tr(text: string | undefined, vars?: Vars): string | undefined {
  return text === undefined ? undefined : translate(currentLang === "si" ? si : null, text, vars);
}
