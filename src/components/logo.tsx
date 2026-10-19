import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * NiHi monogram: a rounded N and H sharing the middle stem. `primary` sits
 * on light backgrounds (white N, lavender H); `white` sits on the blue hero.
 */
export function LogoMark({ className, tone = "primary" }: { className?: string; tone?: "primary" | "white" }) {
  const onPrimary = tone === "primary";
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-9", className)}>
      <rect width="32" height="32" rx="9" className={onPrimary ? "fill-primary" : "fill-white"} />
      <g fill="none" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 23V9l9 14V9" className={onPrimary ? "stroke-white" : "stroke-primary"} />
        <path
          d="M16.5 16h8M24.5 9v14"
          className={onPrimary ? "stroke-[#c7cbff]" : "stroke-primary/55"}
        />
      </g>
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
