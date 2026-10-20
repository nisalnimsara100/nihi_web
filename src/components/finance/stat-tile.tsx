import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StatTile({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl bg-surface p-4 ring-1 ring-line/60 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">{value}</p>
      {sub ? <div className="mt-1 text-xs text-ink-soft">{sub}</div> : null}
    </div>
  );
}
