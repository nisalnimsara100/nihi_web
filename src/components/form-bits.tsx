"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import type { ActionState } from "@/actions/state";
import { COLORS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { Alert, Button } from "./ui";

export function SubmitButton({
  children,
  className,
  pending: pendingProp,
}: {
  children: ReactNode;
  className?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}

export function FormError({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return <Alert>{state.error}</Alert>;
}

export function ColorPicker({ name = "color", defaultValue }: { name?: string; defaultValue?: string }) {
  const initial = defaultValue ?? COLORS[0];
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-ink">Color</legend>
      <div className="flex flex-wrap gap-2">
        {COLORS.map((color) => (
          <label key={color} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={color}
              defaultChecked={color.toLowerCase() === initial.toLowerCase()}
              className="peer sr-only"
            />
            <span className="sr-only">{color}</span>
            <span
              aria-hidden
              className="block size-9 rounded-full ring-offset-2 ring-offset-surface transition peer-checked:ring-[3px] peer-checked:ring-forest peer-focus-visible:ring-[3px] peer-focus-visible:ring-lime"
              style={{ background: color }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Two-step delete: first tap arms it, second tap runs the action. */
export function DeleteButton({
  action,
  label = "Delete",
  confirmLabel = "Tap again to delete",
  size = "md",
  iconOnly = false,
}: {
  action: () => Promise<ActionState | void>;
  label?: string;
  confirmLabel?: string;
  size?: "sm" | "md";
  iconOnly?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        size={size}
        variant={armed ? "danger" : iconOnly ? "ghost" : "secondary"}
        disabled={pending}
        aria-label={iconOnly && !armed ? label : undefined}
        onBlur={() => setArmed(false)}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          startTransition(async () => {
            const result = await action();
            setArmed(false);
            if (result?.error) setError(result.error);
          });
        }}
        className={cn(!armed && !iconOnly && "text-danger")}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
        {armed ? confirmLabel : iconOnly ? null : label}
      </Button>
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}
