"use client";

import { useState } from "react";
import { saveBudget } from "@/actions/budgets";
import { SubmitButton } from "@/components/form-bits";
import { Button, inputClass } from "@/components/ui";
import { useActionForm } from "@/components/use-action-form";
import { budgetStatus } from "@/lib/budgets";
import { CategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/cn";
import { formatMoney, toInputAmount } from "@/lib/money";
import { useT } from "@/lib/i18n/client";

export type BudgetItem = {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  limit: number | null;
  spent: number;
};

const BAR = { ok: "bg-primary", warn: "bg-warning", over: "bg-danger" } as const;

/** One category: spent against its monthly limit, with an inline form to set or change the limit. */
export function BudgetRow({
  item,
  currency,
  readOnly,
  paceNote,
}: {
  item: BudgetItem;
  currency: string;
  readOnly: boolean;
  /** Shown when spending runs ahead of the month, for budgets still within the limit. */
  paceNote?: string;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const { state, pending, onSubmit } = useActionForm(saveBudget, { onSuccess: () => setEditing(false) });
  const errors = state.fieldErrors ?? {};
  const status = item.limit ? budgetStatus(item.spent, item.limit) : null;

  return (
    <li className="py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
          <CategoryIcon name={item.icon} className="size-5" style={{ color: item.color }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{item.name}</span>
          <span className="block text-xs text-ink-soft tabular-nums">
            {item.limit ? t("{spent} of {limit}", { spent: formatMoney(item.spent, currency), limit: formatMoney(item.limit, currency) }) : item.spent > 0 ? t("{spent} spent, no limit", { spent: formatMoney(item.spent, currency) }) : t("No limit set")}
          </span>
        </span>
        {!readOnly && !editing ? (
          <Button type="button" size="sm" variant={item.limit ? "ghost" : "soft"} onClick={() => setEditing(true)}>
            {item.limit ? t("Edit") : t("Set limit")}
          </Button>
        ) : null}
      </div>

      {status ? (
        <div className="mt-2.5 pl-[3.25rem]">
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={t("{percent}% of the {name} budget used", { percent: Math.round(status.ratio * 100), name: item.name })}
          >
            <div className={cn("h-full rounded-full transition-all", BAR[status.level])} style={{ width: `${Math.min(100, status.ratio * 100)}%` }} />
          </div>
          <p className={cn("mt-1 text-xs font-semibold", status.level === "over" ? "text-danger" : "text-ink-soft")}>
            {status.level === "over"
              ? t("Over by {amount}", { amount: formatMoney(-status.left, currency) })
              : status.level === "warn"
                ? t("Careful: only {amount} left ({percent}% used)", { amount: formatMoney(status.left, currency), percent: Math.round(status.ratio * 100) })
                : t("{amount} left", { amount: formatMoney(status.left, currency) })}
            {status.level === "ok" && paceNote ? <span className="font-normal"> · {t(paceNote)}</span> : null}
          </p>
        </div>
      ) : null}

      {editing ? (
        <form onSubmit={onSubmit} className="mt-3 space-y-2 pl-[3.25rem]" noValidate>
          <input type="hidden" name="categoryId" value={item.categoryId} />
          <input type="hidden" name="currency" value={currency} />
          <label htmlFor={`budget-${item.categoryId}`} className="block text-xs font-semibold text-ink-soft">
            {t("Monthly limit ({currency}). Leave empty to remove it.", { currency })}
          </label>
          <div className="flex gap-2">
            <input
              id={`budget-${item.categoryId}`}
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              defaultValue={item.limit ? toInputAmount(item.limit) : ""}
              placeholder={t("e.g. 25000")}
              aria-invalid={!!errors.amount}
              className={cn(inputClass, "h-11 min-w-0 flex-1 tabular-nums")}
            />
            <SubmitButton pending={pending}>{t("Save")}</SubmitButton>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              {t("Cancel")}
            </Button>
          </div>
          {errors.amount?.length ? <p className="text-sm text-danger">{errors.amount[0]}</p> : null}
        </form>
      ) : null}
    </li>
  );
}
