"use client";

import { deleteCard, addCard } from "@/actions/cards";
import { DeleteButton, SubmitButton } from "@/components/form-bits";
import { CreditCard } from "@/components/icons";
import { useActionForm } from "@/components/use-action-form";
import { Card, Field, inputClass } from "@/components/ui";

export type LinkedCard = { id: string; last4: string; name: string };

/**
 * Cards that pay from this account. When a scanned receipt shows one of these
 * card numbers, the transaction is filled in against this account.
 */
export function CardManager({ accountId, cards }: { accountId: string; cards: LinkedCard[] }) {
  const { state, pending, formRef, onSubmit } = useActionForm(addCard, { resetOnSuccess: true });
  const errors = state.fieldErrors ?? {};

  return (
    <Card className="mt-4 p-4 sm:p-6">
      <h2 className="text-base font-bold text-ink">Linked cards</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Link the debit or credit cards that pay from this account. Paying with a card takes the money out of this account.
        Only the last 4 digits are stored.
      </p>

      {cards.length > 0 ? (
        <ul className="mt-4 divide-y divide-line rounded-2xl bg-muted px-4">
          {cards.map((card) => (
            <li key={card.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex min-w-0 items-center gap-3">
                <CreditCard className="size-5 shrink-0 text-ink-soft" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold tabular-nums text-ink">•••• {card.last4}</span>
                  {card.name ? <span className="block truncate text-xs text-ink-soft">{card.name}</span> : null}
                </span>
              </span>
              <DeleteButton action={deleteCard.bind(null, card.id)} label="Remove card" confirmLabel="Tap again to remove" size="sm" iconOnly />
            </li>
          ))}
        </ul>
      ) : null}

      <form ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-3" noValidate>
        <input type="hidden" name="accountId" value={accountId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Last 4 digits" htmlFor="card-last4" error={errors.last4}>
            <input
              id="card-last4"
              name="last4"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              placeholder="8663"
              aria-invalid={!!errors.last4}
              className={inputClass}
            />
          </Field>
          <Field label="Name (optional)" htmlFor="card-name" error={errors.name}>
            <input id="card-name" name="name" maxLength={40} placeholder="Visa debit" className={inputClass} />
          </Field>
        </div>
        <SubmitButton pending={pending}>Link card</SubmitButton>
      </form>
    </Card>
  );
}
