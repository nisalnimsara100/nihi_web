import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * NiHi mark: a lowercase n drawn as a vault door, with an amber coin kept safe
 * inside. `primary` sits on light backgrounds (white vault on indigo); `white`
 * sits on the blue hero.
 */
export function LogoMark({ className, tone = "primary" }: { className?: string; tone?: "primary" | "white" }) {
  const onPrimary = tone === "primary";
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-9", className)}>
      <rect width="32" height="32" rx="9" className={onPrimary ? "fill-primary" : "fill-white"} />
      <path
        d="M8 25.5V15a8 8 0 0 1 16 0v10.5"
        fill="none"
        strokeWidth="5"
        className={onPrimary ? "stroke-white" : "stroke-primary"}
      />
      <circle cx="16" cy="20.2" r="3.1" className="fill-warning" />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  tone = "primary",
}: {
  href?: string;
  className?: string;
  tone?: "primary" | "white";
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} />
      <span className="text-xl font-bold tracking-tight">NiHi</span>
    </Link>
  );
}
