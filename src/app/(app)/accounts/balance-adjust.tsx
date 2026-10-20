"use client";

import { useState, useTransition } from "react";
import { adjustBalance } from "@/actions/accounts";
import { notify } from "@/components/toast";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatMoney, parseAmount } from "@/lib/money";

/** Lets the user correct a balance that drifted from the bank's, without adding a fake transaction. */
export function BalanceAdjust({ accountId, balance, currency, isCredit }: { accountId: string; balance: number; currency: string; isCredit: boolean }) {
  const [actual, setActual] = useState("");
  const [pending, startTransition] = useTransition();
  const target = parseAmount(actual);
  const difference = target === null ? null : target - balance;

  function apply() {
    startTransition(async () => {
      const result = await adjustBalance(accountId, actual);
      if (result.error) notify.error(result.error);
      else {
        notify.success(result.message ?? "Done", result.detail);
        setActual("");
      }
    });
  }

  return (
    <Card className="mt-4 p-4 sm:p-6">
      <h2 className="text-base font-bold text-ink">Match your bank&apos;s balance</h2>
      <p className="mt-1 text-sm text-ink-soft">
        NiHi shows <span className="font-semibold text-ink tabular-nums">{formatMoney(balance, currency)}</span>. If your bank says something
        different, type its balance below. The starting balance is adjusted to close the gap, and your transactions and reports stay as they are.
      </p>
      <div className="mt-4">
        <Field label={isCredit ? "Balance in your bank (a minus means you owe)" : "Balance in your bank"} htmlFor="actual-balance">
          <input
            id="actual-balance"
            inputMode="decimal"
            autoComplete="off"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            placeholder="e.g. 15000.50"
            className={cn(inputClass, "tabular-nums")}
          />
        </Field>
      </div>
      {difference !== null && difference !== 0 ? (
        <p className="mt-2 text-sm font-semibold tabular-nums">
          Difference: {difference > 0 ? "+" : "-"}
          {formatMoney(Math.abs(difference), currency)}
        </p>
      ) : null}
      <Button type="button" className="mt-4" onClick={apply} disabled={pending || target === null || difference === 0}>
        {pending ? "Adjusting…" : "Adjust balance"}
      </Button>
    </Card>
  );
}
