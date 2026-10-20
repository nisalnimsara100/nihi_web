"use client";

import { useState, useTransition } from "react";
import { addToGoal, deleteGoal, saveGoal } from "@/actions/goals";
import { DateField, DeleteButton, SubmitButton } from "@/components/form-bits";
import { notify } from "@/components/toast";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { useActionForm } from "@/components/use-action-form";
import { cn } from "@/lib/cn";
import { CURRENCIES } from "@/lib/constants";
import { goalProgress } from "@/lib/goals";
import { formatMoney, toInputAmount } from "@/lib/money";

export type GoalItem = {
  id: string;
  name: string;
  currency: string;
  targetAmount: number;
  targetDate: string | null;
  accountId: string | null;
  accountName: string | null;
  saved: number;
};
export type SavingsAccount = { id: string; name: string; currency: string };

function GoalForm({ goal, accounts, defaultCurrency, onDone }: { goal?: GoalItem; accounts: SavingsAccount[]; defaultCurrency: string; onDone: () => void }) {
  const { state, pending, formRef, onSubmit } = useActionForm(saveGoal, { resetOnSuccess: !goal, onSuccess: onDone });
  const errors = state.fieldErrors ?? {};
  const [date, setDate] = useState(goal?.targetDate ?? "");
  const [currency, setCurrency] = useState(goal?.currency ?? defaultCurrency);
  const options = accounts.filter((a) => a.currency === currency);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
      {goal ? <input type="hidden" name="id" value={goal.id} /> : null}
      <Field label="Goal" htmlFor={`goal-name-${goal?.id ?? "new"}`} error={errors.name}>
        <input id={`goal-name-${goal?.id ?? "new"}`} name="name" defaultValue={goal?.name} placeholder="e.g. New phone" maxLength={60} aria-invalid={!!errors.name} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target amount" htmlFor={`goal-target-${goal?.id ?? "new"}`} error={errors.targetAmount}>
          <input id={`goal-target-${goal?.id ?? "new"}`} name="targetAmount" inputMode="decimal" defaultValue={goal ? toInputAmount(goal.targetAmount) : ""} placeholder="100000" aria-invalid={!!errors.targetAmount} className={cn(inputClass, "tabular-nums")} />
        </Field>
        <Field label="Currency" htmlFor={`goal-currency-${goal?.id ?? "new"}`}>
          <select id={`goal-currency-${goal?.id ?? "new"}`} name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="By when (optional)" htmlFor={`goal-date-${goal?.id ?? "new"}`} error={errors.targetDate}>
        <div className="space-y-2">
          <DateField id={`goal-date-${goal?.id ?? "new"}`} name="targetDate" value={date} onChange={setDate} required={false} />
          {date ? (
            <button type="button" onClick={() => setDate("")} className="text-sm font-semibold text-primary hover:underline">
              Clear date
            </button>
          ) : null}
        </div>
      </Field>
      <Field label="Follow a savings account" htmlFor={`goal-account-${goal?.id ?? "new"}`} error={errors.accountId} hint="Progress is that account's balance. Leave empty to add money by hand.">
        <select id={`goal-account-${goal?.id ?? "new"}`} name="accountId" defaultValue={goal?.accountId ?? ""} className={inputClass}>
          <option value="">No, I will add money myself</option>
          {options.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex gap-2">
        <SubmitButton pending={pending}>{goal ? "Save changes" : "Add goal"}</SubmitButton>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Button and form to start a new goal. */
export function NewGoal({ accounts, defaultCurrency }: { accounts: SavingsAccount[]; defaultCurrency: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return <Button onClick={() => setOpen(true)}>New goal</Button>;
  }
  return (
    <Card className="p-4 sm:p-6">
      <GoalForm accounts={accounts} defaultCurrency={defaultCurrency} onDone={() => setOpen(false)} />
    </Card>
  );
}

export function GoalCard({ goal, accounts, today, readOnly }: { goal: GoalItem; accounts: SavingsAccount[]; today: string; readOnly: boolean }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();
  const p = goalProgress(goal.saved, goal.targetAmount, goal.targetDate, today);

  function move(sign: 1 | -1) {
    startTransition(async () => {
      const value = amount.trim().replace(/^-/, "");
      const result = await addToGoal(goal.id, sign === 1 ? value : `-${value}`);
      if (result.error) notify.error(result.error);
      else {
        notify.success(result.message ?? "Done", result.detail);
        setAmount("");
      }
    });
  }

  if (editing) {
    return (
      <Card className="p-4 sm:p-6">
        <GoalForm goal={goal} accounts={accounts} defaultCurrency={goal.currency} onDone={() => setEditing(false)} />
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{goal.name}</h3>
          <p className="text-xs text-ink-soft">
            {goal.accountName ? `Following ${goal.accountName}` : "Added by hand"}
            {goal.targetDate ? ` · by ${goal.targetDate}` : ""}
          </p>
        </div>
        {!readOnly ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-2xl font-bold tabular-nums">
        {formatMoney(p.saved, goal.currency)} <span className="text-sm font-medium text-ink-soft">of {formatMoney(p.target, goal.currency)}</span>
      </p>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${Math.round(p.ratio * 100)}% of the goal saved`}>
        <div className={cn("h-full rounded-full", p.reached ? "bg-income" : "bg-primary")} style={{ width: `${Math.max(p.ratio * 100, p.saved > 0 ? 2 : 0)}%` }} />
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        {p.reached
          ? "Goal reached. Well done!"
          : p.overdue
            ? `The date has passed. ${formatMoney(p.remaining, goal.currency)} still to go.`
            : p.perMonth
              ? `Put aside about ${formatMoney(p.perMonth, goal.currency)} a month for ${p.monthsLeft} ${p.monthsLeft === 1 ? "month" : "months"}.`
              : `${formatMoney(p.remaining, goal.currency)} still to go.`}
      </p>

      {!readOnly && !goal.accountId ? (
        <div className="mt-4 flex gap-2">
          <input
            aria-label={`Amount to add to ${goal.name}`}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className={cn(inputClass, "h-10 min-w-0 flex-1 tabular-nums")}
          />
          <Button size="sm" disabled={pending || !amount.trim()} onClick={() => move(1)}>
            Add
          </Button>
          <Button size="sm" variant="secondary" disabled={pending || !amount.trim()} onClick={() => move(-1)}>
            Take out
          </Button>
        </div>
      ) : null}

      {!readOnly && editing === false ? (
        <div className="mt-3 flex justify-end">
          <DeleteButton size="sm" label="Delete goal" confirmLabel="Tap again to delete" action={() => deleteGoal(goal.id)} />
        </div>
      ) : null}
    </Card>
  );
}
