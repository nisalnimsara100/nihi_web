"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteRecurring, saveRecurring } from "@/actions/recurring";
import { DateField, DeleteButton, SubmitButton } from "@/components/form-bits";
import { useActionForm } from "@/components/use-action-form";
import { buttonClass, Card, Field, inputClass } from "@/components/ui";
import type { Enums } from "@/lib/database.types";
import { cn } from "@/lib/cn";
import { FREQUENCIES } from "@/lib/recurring";

type TransactionType = Enums<"TransactionType">;

export type RecurringFormValues = {
  id?: string;
  type: TransactionType;
  amount: string;
  accountId: string;
  toAccountId: string;
  categoryId: string;
  note: string;
  frequency: string;
  nextDate: string;
  endDate: string;
};

type Account = { id: string; name: string; currency: string };
type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

const TYPE_TABS: { value: TransactionType; label: string }[] = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfer" },
];

/** Create or edit a repeating transaction. */
export function RecurringForm({ initial, accounts, categories }: { initial: RecurringFormValues; accounts: Account[]; categories: Category[] }) {
  const { state, pending, onSubmit } = useActionForm(saveRecurring);
  const errors = state.fieldErrors ?? {};
  const [type, setType] = useState(initial.type);
  const [accountId, setAccountId] = useState(initial.accountId);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [nextDate, setNextDate] = useState(initial.nextDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const isTransfer = type === "TRANSFER";
  const visibleCategories = categories.filter((c) => c.type === type);

  function changeType(next: TransactionType) {
    setType(next);
    if (!categories.some((c) => c.id === categoryId && c.type === next)) setCategoryId("");
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
        <input type="hidden" name="type" value={type} />

        <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="radio"
              aria-checked={type === tab.value}
              onClick={() => changeType(tab.value)}
              className={cn("h-11 rounded-xl text-sm font-semibold transition-colors", type === tab.value ? "bg-primary text-on-primary shadow-sm" : "text-ink-soft hover:text-ink")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Field label="Note" htmlFor="note" error={errors.note} hint="What it is, like Rent or Netflix.">
          <input id="note" name="note" maxLength={200} defaultValue={initial.note} placeholder="e.g. House rent" className={inputClass} />
        </Field>

        <Field label="Amount" htmlFor="amount" error={errors.amount}>
          <input id="amount" name="amount" inputMode="decimal" autoComplete="off" defaultValue={initial.amount} placeholder="0.00" aria-invalid={!!errors.amount} className={cn(inputClass, "h-14 text-2xl font-semibold tabular-nums sm:text-2xl")} />
        </Field>

        <div className={cn("grid gap-4", isTransfer && "sm:grid-cols-2")}>
          <Field label={isTransfer ? "From account" : "Account"} htmlFor="accountId" error={errors.accountId}>
            <select id="accountId" name="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </Field>
          {isTransfer ? (
            <Field label="To account" htmlFor="toAccountId" error={errors.toAccountId}>
              <select id="toAccountId" name="toAccountId" defaultValue={initial.toAccountId} aria-invalid={!!errors.toAccountId} className={inputClass}>
                <option value="">Choose account</option>
                {accounts.filter((a) => a.id !== accountId).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>

        {!isTransfer ? (
          <Field label="Category" htmlFor="categoryId" error={errors.categoryId}>
            <select id="categoryId" name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">None</option>
              {visibleCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Repeats" htmlFor="frequency" error={errors.frequency}>
          <select id="frequency" name="frequency" defaultValue={initial.frequency} className={inputClass}>
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={initial.id ? "Next date" : "First date"} htmlFor="nextDate" error={errors.nextDate}>
            <DateField id="nextDate" name="nextDate" value={nextDate} onChange={setNextDate} invalid={!!errors.nextDate} />
          </Field>
          <Field label="Last date (optional)" htmlFor="endDate" error={errors.endDate} hint="Leave empty to repeat until you stop it.">
            <div className="space-y-2">
              <DateField id="endDate" name="endDate" value={endDate} onChange={setEndDate} required={false} invalid={!!errors.endDate} />
              {endDate ? (
                <button type="button" onClick={() => setEndDate("")} className="text-sm font-semibold text-primary hover:underline">
                  Clear last date
                </button>
              ) : null}
            </div>
          </Field>
        </div>

        <p className="rounded-2xl bg-muted p-3 text-sm text-ink-soft">
          Nothing is added on its own. When a date arrives it shows up on your home page, and you tap Add or Skip.
        </p>

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-start sm:justify-between">
          {initial.id ? <DeleteButton action={deleteRecurring.bind(null, initial.id)} /> : <span className="hidden sm:block" />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Link href="/recurring" className={buttonClass("ghost")}>
              Cancel
            </Link>
            <SubmitButton pending={pending}>{initial.id ? "Save changes" : "Add repeat"}</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}
