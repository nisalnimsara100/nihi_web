"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import type { ActionState } from "@/actions/state";
import { ColorPicker, DeleteButton, FormError, SubmitButton } from "@/components/form-bits";
import { useActionForm } from "@/components/use-action-form";
import { Button, Card, ColorDot, Field, inputClass } from "@/components/ui";
import { COLORS } from "@/lib/constants";

type Item = { id: string; name: string; color: string; count: number };
type SaveAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function LabelForm({
  save,
  item,
  hidden,
  submitLabel,
  onDone,
}: {
  save: SaveAction;
  item?: Item;
  hidden?: Record<string, string>;
  submitLabel: string;
  onDone?: () => void;
}) {
  const { state, pending, formRef, onSubmit } = useActionForm(save, { resetOnSuccess: !item, onSuccess: onDone });
  const errors = state.fieldErrors ?? {};
  const nameId = `name-${item?.id ?? hidden?.type ?? "new"}`;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3" noValidate>
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <FormError state={state} />
      <Field label="Name" htmlFor={nameId} error={errors.name}>
        <input id={nameId} name="name" defaultValue={item?.name} aria-invalid={!!errors.name} className={inputClass} />
      </Field>
      <ColorPicker defaultValue={item?.color ?? COLORS[0]} />
      <div className="flex gap-2">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        {onDone && item ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function LabelManager({
  title,
  items,
  save,
  remove,
  hidden,
  noun,
}: {
  title: string;
  items: Item[];
  save: SaveAction;
  remove: (id: string) => Promise<ActionState>;
  hidden?: Record<string, string>;
  noun: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-base font-semibold">
          {title} <span className="font-normal text-ink-soft">({items.length})</span>
        </h2>
        <Button size="sm" variant={adding ? "ghost" : "secondary"} onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
          {adding ? "Close" : (
            <>
              <Plus className="size-4" aria-hidden />
              Add {noun}
            </>
          )}
        </Button>
      </div>

      {adding ? (
        <div className="mx-4 mt-4 rounded-3xl bg-muted p-4 sm:mx-5">
          <LabelForm save={save} hidden={hidden} submitLabel={`Add ${noun}`} />
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-soft sm:px-5">No {noun}s yet.</p>
      ) : (
        <ul className="mt-3 space-y-1 px-2 pb-3">
          {items.map((item) =>
            editing === item.id ? (
              <li key={item.id} className="rounded-2xl bg-muted p-4">
                <LabelForm save={save} item={item} submitLabel="Save" onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={item.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-muted">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest" aria-hidden>
                  <ColorDot color={item.color} className="size-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{item.name}</span>
                  <span className="block text-xs text-ink-soft">
                    {item.count} transaction{item.count === 1 ? "" : "s"}
                  </span>
                </span>
                <Button size="sm" variant="ghost" aria-label={`Edit ${item.name}`} onClick={() => setEditing(item.id)}>
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <DeleteButton
                  size="sm"
                  iconOnly
                  label={`Delete ${item.name}`}
                  confirmLabel="Delete?"
                  action={() => remove(item.id)}
                />
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}
