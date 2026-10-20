"use client";

import { useState, useTransition } from "react";
import { confirmRecurring, skipRecurring } from "@/actions/recurring";
import { Button } from "@/components/ui";
import { notify } from "@/components/toast";

export type DueItem = {
  id: string;
  title: string;
  /** Already formatted, like "Rs. 25,000.00". */
  amount: string;
  /** "Due today", "Due 3 days ago". */
  when: string;
  accountName: string;
  /** Occurrences waiting after this one. */
  more: number;
};

/** Repeating transactions that have come due. The user adds or skips each; nothing is added on its own. */
export function DueRecurring({ items }: { items: DueItem[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(item: DueItem, action: typeof confirmRecurring) {
    setBusy(item.id);
    startTransition(async () => {
      const result = await action(item.id);
      setBusy(null);
      if (result.error) notify.error(result.error);
      else notify.success(result.message ?? "Done", result.detail);
    });
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{item.title}</span>
            <span className="block text-xs text-ink-soft">
              {item.when} · {item.accountName}
              {item.more > 0 ? ` · ${item.more} more after this` : ""}
            </span>
          </span>
          <span className="text-sm font-semibold tabular-nums">{item.amount}</span>
          <span className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={busy === item.id} onClick={() => run(item, skipRecurring)}>
              Skip
            </Button>
            <Button size="sm" disabled={busy === item.id} onClick={() => run(item, confirmRecurring)}>
              Add
            </Button>
          </span>
        </li>
      ))}
    </ul>
  );
}
