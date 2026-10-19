"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";

/** Filters fold behind a button on small screens and stay open on large ones. */
export function FilterPanel({ activeCount, children }: { activeCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="lg:hidden"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        {activeCount > 0 ? (
          <span className="rounded-full bg-lime px-1.5 text-xs font-bold text-on-lime">{activeCount}</span>
        ) : null}
      </Button>
      <div className={cn("mt-3 lg:mt-0 lg:block", open ? "block" : "hidden")}>{children}</div>
    </div>
  );
}
