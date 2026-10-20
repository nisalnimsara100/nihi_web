"use client";

import { useSyncExternalStore } from "react";

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
  return <>{text}</>;
}
