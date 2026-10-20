import type { CSSProperties } from "react";

/** Lavender, a touch deeper than primary-soft, at the given opacity. */
const tint = (alpha: number) =>
  `color-mix(in oklab, color-mix(in oklab, var(--hero-from) 22%, var(--primary-soft)) ${alpha}%, transparent)`;

// Broad, flat pastel washes rather than spotlights: the left side and the
// top-right corner pick up a lavender tint, the middle stays light, and the
// whole thing fades out into the canvas further down.
const WASH: CSSProperties = {
  backgroundImage: [
    `radial-gradient(55% 85% at 0% 50%, ${tint(80)} 0%, ${tint(40)} 45%, transparent 100%)`,
    `radial-gradient(45% 60% at 100% 0%, ${tint(70)} 0%, ${tint(30)} 45%, transparent 100%)`,
  ].join(", "),
};

/** Backdrop for the top of the landing page; fades out into the canvas. */
export function HeroBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[62rem] mask-b-from-55% mask-b-to-100% sm:h-[70rem]"
      style={WASH}
    />
  );
}
