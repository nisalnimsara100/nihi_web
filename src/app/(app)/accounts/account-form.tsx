"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteAccount, saveAccount } from "@/actions/accounts";
import { AccountCardFace } from "@/components/finance/account-card";
import { CardThemePicker } from "@/components/finance/card-theme-picker";
import { ColorPicker, DeleteButton, SubmitButton } from "@/components/form-bits";
import { useActionForm } from "@/components/use-action-form";
import { buttonClass, Card, Field, inputClass } from "@/components/ui";
import type { Enums } from "@/lib/database.types";
import { ACCOUNT_TYPES, accountTypeLabel, CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { creditFaceInfo, creditSummary } from "@/lib/credit-card";
import { formatMoney, parseAmount } from "@/lib/money";

type AccountType = Enums<"AccountType">;

export type AccountFormValues = {
  id?: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: string;
  color: string;
  theme: string;
  note: string;
  archived: boolean;
  /** Credit card only, as text for the inputs. Empty when not set. */
  creditLimit: string;
  /** Interest per month, in percent. */
  interestRate: string;
  /** Current balance minus the starting balance, so the preview shows the real balance while editing. */
  balanceOffset?: number;
};

export function AccountForm({ initial }: { initial: AccountFormValues }) {
  const { state, pending, onSubmit } = useActionForm(saveAccount);
  const errors = state.fieldErrors ?? {};

  // Everything the preview card shows, kept in sync with the inputs.
  const [preview, setPreview] = useState({
    name: initial.name,
    type: initial.type,
    currency: initial.currency,
    initialBalance: initial.initialBalance,
    color: initial.color,
    theme: initial.theme,
    creditLimit: initial.creditLimit,
    interestRate: initial.interestRate,
  });
  const update = (patch: Partial<typeof preview>) => setPreview((p) => ({ ...p, ...patch }));
  const previewBalance = (initial.balanceOffset ?? 0) + (parseAmount(preview.initialBalance || "0") ?? 0);
  const isCredit = preview.type === "CREDIT_CARD";
  const creditSummaryNow = creditSummary(previewBalance, {
    creditLimit: parseAmount(preview.creditLimit || ""),
    interestRate: preview.interestRate.trim() && Number.isFinite(Number(preview.interestRate)) ? Number(preview.interestRate) : null,
  });
  const previewCredit = isCredit ? creditFaceInfo(creditSummaryNow, preview.currency) : undefined;

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

        <div className="rounded-3xl bg-muted p-4 sm:p-6">
          <AccountCardFace
            theme={preview.theme}
            type={preview.type}
            name={preview.name.trim() || "Account name"}
            balance={formatMoney(previewBalance, preview.currency)}
            currency={preview.currency}
            color={preview.color}
            label={accountTypeLabel(preview.type)}
            credit={previewCredit}
            className="mx-auto max-w-sm shadow-lg shadow-primary/10 transition-[background] duration-300"
          />
        </div>

        <Field label="Name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            defaultValue={initial.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Main bank"
            aria-invalid={!!errors.name}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="type" error={errors.type}>
            <select
              id="type"
              name="type"
              defaultValue={initial.type}
              onChange={(e) => update({ type: e.target.value as AccountType })}
              className={inputClass}
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Currency" htmlFor="currency" error={errors.currency}>
            <select
              id="currency"
              name="currency"
              defaultValue={initial.currency}
              onChange={(e) => update({ currency: e.target.value })}
              className={inputClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Starting balance"
          htmlFor="initialBalance"
          error={errors.initialBalance}
          hint="What was in the account before you started tracking. Use a minus for debt."
        >
          <input
            id="initialBalance"
            name="initialBalance"
            inputMode="decimal"
            defaultValue={initial.initialBalance}
            onChange={(e) => update({ initialBalance: e.target.value })}
            placeholder="0.00"
            aria-invalid={!!errors.initialBalance}
            className={cn(inputClass, "tabular-nums")}
          />
        </Field>

        {isCredit ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Credit limit"
              htmlFor="creditLimit"
              error={errors.creditLimit}
              hint={creditSummaryNow.available !== null ? `Remaining: ${formatMoney(creditSummaryNow.available, preview.currency)}` : "The most the bank lets you owe."}
            >
              <input
                id="creditLimit"
                name="creditLimit"
                inputMode="decimal"
                defaultValue={initial.creditLimit}
                onChange={(e) => update({ creditLimit: e.target.value })}
                placeholder="e.g. 200000"
                className={cn(inputClass, "tabular-nums")}
              />
            </Field>
            <Field
              label="Interest rate (% per month)"
              htmlFor="interestRate"
              error={errors.interestRate}
              hint={creditSummaryNow.monthlyInterest ? `About ${formatMoney(creditSummaryNow.monthlyInterest, preview.currency)} a month on what you owe` : "Optional."}
            >
              <input
                id="interestRate"
                name="interestRate"
                inputMode="decimal"
                defaultValue={initial.interestRate}
                onChange={(e) => update({ interestRate: e.target.value })}
                placeholder="e.g. 3"
                className={cn(inputClass, "tabular-nums")}
              />
            </Field>
          </div>
        ) : null}

        <CardThemePicker value={preview.theme} onChange={(theme) => update({ theme })} />

        <ColorPicker defaultValue={initial.color} onChange={(color) => update({ color })} />

        <Field label="Note" htmlFor="note" error={errors.note}>
          <input id="note" name="note" defaultValue={initial.note} placeholder="Optional" className={inputClass} />
        </Field>

        {initial.id ? (
          <label className="flex items-start gap-3 rounded-2xl bg-muted p-4">
            <input type="checkbox" name="archived" defaultChecked={initial.archived} className="mt-0.5 size-4 accent-primary" />
            <span>
              <span className="block text-sm font-medium">Archived</span>
              <span className="block text-sm text-ink-soft">
                Hidden from the dashboard and new transactions. History is kept.
              </span>
            </span>
          </label>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-start sm:justify-between">
          {initial.id ? <DeleteButton action={deleteAccount.bind(null, initial.id)} /> : <span className="hidden sm:block" />}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Link href="/accounts" className={buttonClass("ghost")}>
              Cancel
            </Link>
            <SubmitButton pending={pending}>{initial.id ? "Save changes" : "Add account"}</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}
