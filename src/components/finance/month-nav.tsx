import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const arrow =
  "inline-flex size-9 items-center justify-center rounded-full bg-forest text-on-forest transition-colors hover:bg-forest-soft";

/** Previous / current period / next control. */
export function PeriodNav({ label, prevHref, nextHref }: { label: string; prevHref: string; nextHref: string }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-line/60">
      <Link href={prevHref} aria-label="Previous period" className={arrow}>
        <ChevronLeft className="size-4" aria-hidden />
      </Link>
      <span className="min-w-32 text-center text-sm font-bold">{label}</span>
      <Link href={nextHref} aria-label="Next period" className={arrow}>
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
