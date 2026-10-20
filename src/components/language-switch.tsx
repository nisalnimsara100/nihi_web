"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguage } from "@/actions/language";
import { cn } from "@/lib/cn";
import { useLang } from "@/lib/i18n/client";
import { LANGS } from "@/lib/i18n/translate";

/** English / සිංහල choice. Saves to a cookie and reloads the page in the new language. */
export function LanguageSwitch({ className }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="radiogroup" aria-label="Language" className={cn("inline-flex gap-1 rounded-2xl bg-muted p-1", className)}>
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          role="radio"
          aria-checked={lang === l.value}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setLanguage(l.value);
              router.refresh();
            })
          }
          className={cn(
            "h-9 rounded-xl px-4 text-sm font-semibold transition-colors",
            lang === l.value ? "bg-primary text-on-primary shadow-sm" : "text-ink-soft hover:text-ink",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
