import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * NiHi monogram: a rounded N and H sharing the middle stem. On light
 * backgrounds (`forest`) the N is white and the H lime; on the lime
 * sidebar (`lime`) both are forest.
 */
export function LogoMark({ className, tone = "forest" }: { className?: string; tone?: "forest" | "lime" }) {
  const onForest = tone === "forest";
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-9", className)}>
      <rect width="32" height="32" rx="9" className={onForest ? "fill-forest" : "fill-lime"} />
      <g fill="none" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 23V9l9 14V9" className={onForest ? "stroke-white" : "stroke-forest"} />
        <path d="M16.5 16h8M24.5 9v14" className={onForest ? "stroke-lime" : "stroke-forest"} />
      </g>
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  tone = "forest",
}: {
  href?: string;
  className?: string;
  tone?: "forest" | "lime";
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} />
      <span className="font-display text-2xl font-black tracking-tight font-stretch-condensed">NiHi</span>
    </Link>
  );
}
