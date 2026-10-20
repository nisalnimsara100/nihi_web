import { getLang } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";

/** Reads the language cookie and gives it to every client component below. */
export async function LangScope({ children }: { children: React.ReactNode }) {
  return <I18nProvider lang={await getLang()}>{children}</I18nProvider>;
}
