"use client";

import { useT } from "@/lib/i18n/client";

/** Shown when a page fails while rendering. The server has already logged the error (see instrumentation.ts). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("Something went wrong")}</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">{t("The page could not be shown. Your data is safe. Try again, and if it keeps happening, tell us the code below.")}</p>
      {error.digest ? <p className="mt-3 rounded-xl bg-muted px-3 py-1.5 font-mono text-xs text-ink-soft">{error.digest}</p> : null}
      <button type="button" onClick={reset} className="mt-6 inline-flex h-11 items-center rounded-2xl bg-primary px-6 text-sm font-semibold text-on-primary">
        {t("Try again")}
      </button>
    </div>
  );
}
