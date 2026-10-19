"use client";

import Link from "next/link";
import { deleteAccount, saveAccount } from "@/actions/accounts";
import { ColorPicker, DeleteButton, FormError, SubmitButton } from "@/components/form-bits";
import { useActionForm } from "@/components/use-action-form";
import { buttonClass, Card, Field, inputClass } from "@/components/ui";
import type { AccountType } from "@/generated/prisma/enums";
import { ACCOUNT_TYPES, CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/cn";

export type AccountFormValues = {
  id?: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: string;
  color: string;
  note: string;
  archived: boolean;
};

export function AccountForm({ initial }: { initial: AccountFormValues }) {
  const { state, pending, onSubmit } = useActionForm(saveAccount);
  const errors = state.fieldErrors ?? {};

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
        <FormError state={state} />

        <Field label="Name" htmlFor="name" error={errors.name}>
          <input id="name" name="name" defaultValue={initial.name} placeholder="e.g. Main bank" aria-invalid={!!errors.name} className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="type" error={errors.type}>
            <select id="type" name="type" defaultValue={initial.type} className={inputClass}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Currency" htmlFor="currency" error={errors.currency}>
            <select id="currency" name="currency" defaultValue={initial.currency} className={inputClass}>
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
            placeholder="0.00"
            aria-invalid={!!errors.initialBalance}
            className={cn(inputClass, "tabular-nums")}
          />
        </Field>

        <ColorPicker defaultValue={initial.color} />

        <Field label="Note" htmlFor="note" error={errors.note}>
          <input id="note" name="note" defaultValue={initial.note} placeholder="Optional" className={inputClass} />
        </Field>

        {initial.id ? (
          <label className="flex items-start gap-3 rounded-2xl bg-muted p-4">
            <input type="checkbox" name="archived" defaultChecked={initial.archived} className="mt-0.5 size-4 accent-forest" />
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
