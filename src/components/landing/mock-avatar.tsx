import { useId } from "react";
import { cn } from "@/lib/cn";

/** Illustrated profile picture for the demo user in the product mockups. */
export function MockAvatar({ className }: { className?: string }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-8 rounded-full ring-2 ring-white/40", className)}>
      <clipPath id={clip}>
        <circle cx="20" cy="20" r="20" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect width="40" height="40" fill="#ffd9a8" />
        <path d="M5 40c0-8.5 6.5-13 15-13s15 4.5 15 13Z" fill="#f4f4f8" />
        <path d="M16.2 27.3 20 32l3.8-4.7Z" fill="#b5754f" />
        <rect x="16.6" y="20" width="6.8" height="8" rx="3" fill="#b5754f" />
        <circle cx="12.9" cy="17" r="1.7" fill="#c68863" />
        <circle cx="27.1" cy="17" r="1.7" fill="#c68863" />
        <ellipse cx="20" cy="16.2" rx="7" ry="8" fill="#c68863" />
        <path d="M12.7 15.6C12.1 9.2 15.6 6.4 20.2 6.4c5 0 8 2.7 7.2 8.8-1-3-3.4-4.3-6.9-4.1-3.6.2-6.5 1.3-7.8 4.5Z" fill="#231c18" />
        <circle cx="17.4" cy="16.6" r="0.85" fill="#231c18" />
        <circle cx="22.6" cy="16.6" r="0.85" fill="#231c18" />
        <path d="M17.8 20.1q2.2 1.6 4.4 0" fill="none" stroke="#7a4128" strokeWidth="0.9" strokeLinecap="round" />
      </g>
    </svg>
  );
}
