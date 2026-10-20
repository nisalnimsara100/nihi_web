"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { findSimilar, type SimilarTransaction } from "@/actions/transactions";
import { Warning } from "@/components/icons";
import { dayToDate, formatDay } from "@/lib/dates";

/**
 * Warns when a transaction like the one being entered (same account, type and amount, within a day)
 * is already saved, so the same SMS or receipt isn't added twice. It only informs; saving is never blocked.
 */
export function SimilarWarning({
  type,
  amount,
  accountId,
  day,
  excludeId,
}: {
  type: string;
  /** Minor units, or null while the amount is empty or invalid. */
  amount: number | null;
  accountId: string;
  day: string;
  excludeId?: string;
}) {
  const key = `${type}|${amount}|${accountId}|${day}|${excludeId ?? ""}`;
  const [found, setFound] = useState<{ key: string; list: SimilarTransaction[] } | null>(null);

  useEffect(() => {
    if (!amount || amount <= 0 || !accountId || !day) return;
    let live = true;
    // Wait a moment so typing an amount doesn't ask the server on every key.
    const timer = setTimeout(async () => {
      try {
        const list = await findSimilar({ type, amount, accountId, day, excludeId });
        if (live) setFound({ key, list });
      } catch {
        // A failed check just means no warning.
      }
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [key, type, amount, accountId, day, excludeId]);

  const list = found?.key === key ? found.list : [];
  if (list.length === 0) return null;

  return (
    <div role="status" className="rounded-2xl bg-warning-soft p-3 text-sm text-ink">
      <p className="flex items-center gap-2 font-semibold">
        <Warning className="size-4 shrink-0" aria-hidden />
        Looks like one you already added
      </p>
      <ul className="mt-1.5 space-y-0.5 pl-6">
        {list.map((t) => (
          <li key={t.id}>
            <Link href={`/transactions/${t.id}`} target="_blank" className="font-semibold underline">
              {formatDay(dayToDate(t.day))}
              {t.note ? ` · ${t.note}` : ""}
              {t.category ? ` · ${t.category}` : ""}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 pl-6 text-ink-soft">If this is a new payment, you can ignore this.</p>
    </div>
  );
}
