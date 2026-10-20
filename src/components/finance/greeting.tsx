"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/client";

function partOfDay() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning!" : h < 18 ? "Good Afternoon!" : "Good Evening!";
}

/** Greeting from the viewer's own clock; the server renders a neutral fallback. */
export function Greeting() {
  const text = useSyncExternalStore(
    () => () => {},
    partOfDay,
    () => "Good Day!",
  );
  const t = useT();
  return <>{t(text)}</>;
}
