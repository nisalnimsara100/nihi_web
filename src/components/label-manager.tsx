"use client";

import { useState } from "react";
import { PencilSimple, Plus } from "@/components/icons";
import type { ActionState } from "@/actions/state";
import { ColorPicker, DeleteButton, IconPicker, SubmitButton } from "@/components/form-bits";
import { useActionForm } from "@/components/use-action-form";
import { Button, Card, ColorDot, Field, inputClass } from "@/components/ui";
import { CategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/cn";
import { COLORS } from "@/lib/constants";

/** `icon` is set for categories; tags have none and show a color dot. */
type Item = { id: string; name: string; color: string; count: number; icon?: string };
type SaveAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function LabelForm({
  save,
  item,
  hidden,
  submitLabel,
  onDone,
  withIcon,
}: {
  save: SaveAction;
  item?: Item;
  hidden?: Record<string, string>;
  submitLabel: string;
  onDone?: () => void;
  withIcon?: boolean;
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
      <Field label="Name" htmlFor={nameId} error={errors.name}>
        <input id={nameId} name="name" defaultValue={item?.name} aria-invalid={!!errors.name} className={inputClass} />
      </Field>
      {withIcon ? <IconPicker defaultValue={item?.icon} /> : null}
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
  withIcon = false,
  readOnly = false,
}: {
  title: string;
  items: Item[];
  save: SaveAction;
  remove: (id: string) => Promise<ActionState>;
  hidden?: Record<string, string>;
  noun: string;
  withIcon?: boolean;
  /** Shows the list without add, edit or delete controls. */
  readOnly?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-base font-semibold">
          {title} <span className="font-normal text-ink-soft">({items.length})</span>
        </h2>
        {readOnly ? null : (
          <Button size="sm" variant={adding ? "ghost" : "secondary"} onClick={() => setAdding((v) => !v)} aria-expanded={adding}>
            {adding ? "Close" : (
              <>
                <Plus className="size-4" aria-hidden />
                Add {noun}
              </>
            )}
          </Button>
        )}
      </div>

      {adding && !readOnly ? (
        <div className="mx-4 mt-4 rounded-3xl p-4 ring-1 ring-line sm:mx-5">
          <LabelForm save={save} hidden={hidden} submitLabel={`Add ${noun}`} withIcon={withIcon} />
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink-soft sm:px-5">No {noun}s yet.</p>
      ) : (
        <ul className="mt-3 space-y-1 px-2 pb-3">
          {items.map((item) =>
            editing === item.id && !readOnly ? (
              <li key={item.id} className="rounded-2xl p-4 ring-1 ring-line">
                <LabelForm
                  save={save}
                  item={item}
                  hidden={hidden}
                  submitLabel="Save"
                  onDone={() => setEditing(null)}
                  withIcon={withIcon}
                />
              </li>
            ) : (
              <li key={item.id} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5", !readOnly && "transition-colors hover:bg-muted")}>
                <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface text-ink shadow-[0_1px_3px_rgb(20_21_28/0.08)] ring-1 ring-line/60" aria-hidden>
                  {item.icon ? (
                    <>
                      <CategoryIcon name={item.icon} className="size-5" />
                      <span className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full ring-2 ring-surface" style={{ background: item.color }} />
                    </>
                  ) : (
                    <ColorDot color={item.color} className="size-3" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.name}</span>
                  <span className="block text-xs text-ink-soft">
                    {item.count} transaction{item.count === 1 ? "" : "s"}
                  </span>
                </span>
                {readOnly ? null : (
                  <>
                    <Button size="sm" variant="ghost" aria-label={`Edit ${item.name}`} onClick={() => setEditing(item.id)}>
                      <PencilSimple className="size-4" aria-hidden />
                    </Button>
                    <DeleteButton
                      size="sm"
                      iconOnly
                      label={`Delete ${item.name}`}
                      confirmLabel="Delete?"
                      action={() => remove(item.id)}
                    />
                  </>
                )}
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}
