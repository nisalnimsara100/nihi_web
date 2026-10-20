"use client";

import { useEffect, useState } from "react";

/**
 * Colors the phone's status bar to match a hero header that reaches the top
 * edge. Newer iOS Safari ignores the theme-color meta tag and instead tints the
 * bar from a fixed element at the top of the page, so this adds a thin one. It
 * fades out once the page scrolls, when white content is under the bar.
 */
export function StatusBarTint() {
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      aria-hidden
      className="bg-hero pointer-events-none fixed inset-x-0 top-0 z-40 h-2 transition-opacity duration-200 sm:hidden"
      style={{ opacity: atTop ? 1 : 0 }}
    />
  );
}
