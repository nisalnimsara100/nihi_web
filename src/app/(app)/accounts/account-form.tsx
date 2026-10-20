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
import { todayDay } from "@/lib/dates";
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
  /** Credit card terms, as text for the inputs. Empty when not set. */
  creditLimit: string;
  statementDay: string;
  dueDay: string;
  interestRate: string;
  annualFee: string;
  lateFee: string;
  minPaymentPercent: string;
  minPaymentFloor: string;
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
    dueDay: initial.dueDay,
  });
  const update = (patch: Partial<typeof preview>) => setPreview((p) => ({ ...p, ...patch }));
  const previewBalance = (initial.balanceOffset ?? 0) + (parseAmount(preview.initialBalance || "0") ?? 0);
  const isCredit = preview.type === "CREDIT_CARD";
  const previewCredit = isCredit
    ? creditFaceInfo(
        creditSummary(
          previewBalance,
          {
            creditLimit: parseAmount(preview.creditLimit || "") ,
            statementDay: null,
            dueDay: Number(preview.dueDay) >= 1 && Number(preview.dueDay) <= 31 ? Number(preview.dueDay) : null,
            interestRate: null,
            annualFee: null,
            lateFee: null,
            minPaymentPercent: 5,
            minPaymentFloor: 0,
          },
          todayDay(),
        ),
        preview.currency,
      )
    : undefined;

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
          // A div instead of a fieldset: a legend sits on the border and overlapped the text below it.
          // The inputs are grey, so the box is white with an outline to keep them visible.
          <div role="group" aria-labelledby="credit-terms-title" className="space-y-4 rounded-3xl border border-line p-4 sm:p-5">
            <h3 id="credit-terms-title" className="text-base font-bold text-ink">Credit card terms</h3>
            <p className="text-sm text-ink-soft">
              Copy these from your card statement or your bank&apos;s fee schedule. NiHi uses them to show your available credit and
              payment due date. They are estimates; your statement is always the final word.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Credit limit" htmlFor="creditLimit" error={errors.creditLimit}>
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
              <Field label="Interest rate (% per year)" htmlFor="interestRate" error={errors.interestRate}>
                <input id="interestRate" name="interestRate" inputMode="decimal" defaultValue={initial.interestRate} placeholder="e.g. 24" className={cn(inputClass, "tabular-nums")} />
              </Field>
              <Field label="Statement day" htmlFor="statementDay" error={errors.statementDay} hint="Day of the month your statement is issued.">
                <input id="statementDay" name="statementDay" inputMode="numeric" maxLength={2} defaultValue={initial.statementDay} placeholder="e.g. 5" className={cn(inputClass, "tabular-nums")} />
              </Field>
              <Field label="Payment due day" htmlFor="dueDay" error={errors.dueDay} hint="Day of the month the payment is due.">
                <input
                  id="dueDay"
                  name="dueDay"
                  inputMode="numeric"
                  maxLength={2}
                  defaultValue={initial.dueDay}
                  onChange={(e) => update({ dueDay: e.target.value })}
                  placeholder="e.g. 25"
                  className={cn(inputClass, "tabular-nums")}
                />
              </Field>
              <Field label="Minimum payment (% of balance)" htmlFor="minPaymentPercent" error={errors.minPaymentPercent} hint="Often 4 to 5%.">
                <input id="minPaymentPercent" name="minPaymentPercent" inputMode="decimal" defaultValue={initial.minPaymentPercent} className={cn(inputClass, "tabular-nums")} />
              </Field>
              <Field label="Minimum payment, at least" htmlFor="minPaymentFloor" error={errors.minPaymentFloor} hint="The smallest minimum your bank asks for.">
                <input id="minPaymentFloor" name="minPaymentFloor" inputMode="decimal" defaultValue={initial.minPaymentFloor} className={cn(inputClass, "tabular-nums")} />
              </Field>
              <Field label="Annual fee" htmlFor="annualFee" error={errors.annualFee}>
                <input id="annualFee" name="annualFee" inputMode="decimal" defaultValue={initial.annualFee} placeholder="optional" className={cn(inputClass, "tabular-nums")} />
              </Field>
              <Field label="Late payment fee" htmlFor="lateFee" error={errors.lateFee}>
                <input id="lateFee" name="lateFee" inputMode="decimal" defaultValue={initial.lateFee} placeholder="optional" className={cn(inputClass, "tabular-nums")} />
              </Field>
            </div>
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
