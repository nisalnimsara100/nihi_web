"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/**
 * Marks itself `data-inview="out"` once hydrated and `"in"` the first time it
 * scrolls into view, so CSS can play the `fx-*` animations inside it. Without
 * JavaScript the attribute never appears and everything simply shows.
 */
export function InView(props: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.inview = "out";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.inview = "in";
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} {...props} />;
}
