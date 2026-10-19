import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const arrow =
  "inline-flex size-9 items-center justify-center rounded-xl bg-primary-soft text-on-primary-soft transition-colors hover:bg-primary-soft-strong";

/** Previous / current period / next control. */
export function PeriodNav({ label, prevHref, nextHref }: { label: string; prevHref: string; nextHref: string }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-surface p-1 ring-1 ring-line/70">
      <Link href={prevHref} aria-label="Previous period" className={arrow}>
        <ChevronLeft className="size-4" aria-hidden />
      </Link>
      <span className="min-w-32 text-center text-sm font-semibold">{label}</span>
      <Link href={nextHref} aria-label="Next period" className={arrow}>
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
