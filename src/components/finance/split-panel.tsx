"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { splitTransaction } from "@/actions/transactions";
import { notify } from "@/components/toast";
import { Button, Card, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatMoney, parseAmount, toInputAmount } from "@/lib/money";
import { useT } from "@/lib/i18n/client";

type Category = { id: string; name: string };
type Part = { amount: string; categoryId: string; note: string };

/**
 * Splits one transaction into several categories, for example a supermarket bill that was part
 * groceries and part household. The parts must add up to the full amount.
 */
export function SplitPanel({
  id,
  total,
  currency,
  categories,
  note,
  categoryId,
}: {
  id: string;
  total: number;
  currency: string;
  categories: Category[];
  note: string;
  categoryId: string;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [pending, startTransition] = useTransition();

  const minor = parts.map((p) => parseAmount(p.amount) ?? 0);
  const left = total - minor.reduce((a, b) => a + b, 0);
  const valid = parts.length >= 2 && left === 0 && minor.every((m) => m > 0);

  function start() {
    // Two rows to begin with: the whole amount in the first, nothing in the second.
    setParts([
      { amount: toInputAmount(total), categoryId, note },
      { amount: "", categoryId: "", note },
    ]);
    setOpen(true);
  }

  const change = (i: number, patch: Partial<Part>) => setParts((all) => all.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  function submit() {
    startTransition(async () => {
      const result = await splitTransaction({ id, parts: parts.map((p, i) => ({ amount: minor[i], categoryId: p.categoryId, note: p.note })) });
      if (result.error) {
        notify.error(result.error);
        return;
      }
      notify.success(result.message ?? "Split", result.detail);
      router.push("/transactions");
    });
  }

  if (!open) {
    return (
      <p className="mt-4 text-center text-sm">
        <button type="button" onClick={start} className="font-semibold text-primary hover:underline">
          {t("Split this transaction")}
        </button>
      </p>
    );
  }

  return (
    <Card className="mt-4 p-4 sm:p-6">
      <h2 className="text-base font-bold text-ink">{t("Split")} {formatMoney(total, currency)}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("Divide it between categories. The parts replace this transaction and must add up to the full amount.")}</p>

      <ul className="mt-4 space-y-4">
        {parts.map((p, i) => (
          <li key={i} className="space-y-2 rounded-2xl bg-muted p-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                aria-label={`Amount of part ${i + 1}`}
                inputMode="decimal"
                value={p.amount}
                onChange={(e) => change(i, { amount: e.target.value })}
                placeholder="0.00"
                className={cn(inputClass, "bg-surface tabular-nums")}
              />
              <select aria-label={`Category of part ${i + 1}`} value={p.categoryId} onChange={(e) => change(i, { categoryId: e.target.value })} className={cn(inputClass, "bg-surface")}>
                <option value="">{t("No category")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input aria-label={`Note of part ${i + 1}`} value={p.note} maxLength={500} onChange={(e) => change(i, { note: e.target.value })} placeholder={t("Note")} className={cn(inputClass, "bg-surface")} />
              {parts.length > 2 ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setParts((all) => all.filter((_, j) => j !== i))}>
                  {t("Remove")}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <p className={cn("mt-3 text-sm font-semibold tabular-nums", left === 0 ? "text-income" : "text-ink-soft")}>
        {left === 0 ? "Adds up exactly" : left > 0 ? `${formatMoney(left, currency)} still to place` : `${formatMoney(-left, currency)} too much`}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setParts((all) => [...all, { amount: left > 0 ? toInputAmount(left) : "", categoryId: "", note }])} disabled={parts.length >= 20}>
          {t("Add a part")}
        </Button>
        <span className="flex-1" />
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t("Cancel")}
        </Button>
        <Button type="button" onClick={submit} disabled={!valid || pending}>
          {pending ? "Splitting…" : "Split"}
        </Button>
      </div>
    </Card>
  );
}
