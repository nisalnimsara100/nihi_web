"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Calendar, CircleNotch, Trash } from "@/components/icons";
import type { ActionState } from "@/actions/state";
import { CATEGORY_ICON_NAMES, CategoryIcon, DEFAULT_CATEGORY_ICON, isCategoryIcon } from "@/lib/category-icons";
import { COLORS } from "@/lib/constants";
import { dateToDay, dayToDate, todayDay } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { notify } from "./toast";
import { Button } from "./ui";

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
      {pending ? <CircleNotch className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}

export function ColorPicker({
  name = "color",
  defaultValue,
  onChange,
}: {
  name?: string;
  defaultValue?: string;
  onChange?: (color: string) => void;
}) {
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
              onChange={() => onChange?.(color)}
              className="peer sr-only"
            />
            <span className="sr-only">{color}</span>
            <span
              aria-hidden
              className="block size-9 rounded-full ring-offset-2 ring-offset-surface transition peer-checked:ring-[3px] peer-checked:ring-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-primary/40"
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
            if (result?.error) notify.error(result.error);
            else if (result?.message) notify.success(result.message, result.detail);
          });
        }}
        className={cn(!armed && !iconOnly && "text-danger")}
      >
        {pending ? <CircleNotch className="size-4 animate-spin" aria-hidden /> : <Trash className="size-4" aria-hidden />}
        {armed ? confirmLabel : iconOnly ? null : label}
      </Button>
    </div>
  );
}

export function IconPicker({ name = "icon", defaultValue }: { name?: string; defaultValue?: string }) {
  const initial = defaultValue && isCategoryIcon(defaultValue) ? defaultValue : DEFAULT_CATEGORY_ICON;
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-semibold text-ink">Icon</legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
        {CATEGORY_ICON_NAMES.map((icon) => (
          <label key={icon} className="relative flex cursor-pointer justify-center" title={icon}>
            <input type="radio" name={name} value={icon} defaultChecked={icon === initial} className="peer sr-only" />
            <span className="sr-only">{icon}</span>
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-2xl bg-muted text-ink-soft transition-colors hover:bg-line peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-primary/40"
            >
              <CategoryIcon name={icon} className="size-5" />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * A date field that reads like a sentence ("Mon, 19 Oct 2026") with a calendar icon at the
 * right and Today / Yesterday shortcuts. The browser's own date input sits invisibly on top,
 * so tapping anywhere opens the native picker and the form still submits `name` as YYYY-MM-DD.
 */
export function DateField({
  id,
  name,
  value,
  onChange,
  invalid,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (day: string) => void;
  invalid?: boolean;
}) {
  const today = todayDay();
  const yesterday = dateToDay(new Date(dayToDate(today).getTime() - 86_400_000));
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value);

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative flex h-12 items-center justify-between gap-3 rounded-2xl border border-transparent bg-muted px-4 text-base text-ink sm:text-sm",
          "focus-within:border-primary focus-within:bg-surface focus-within:ring-4 focus-within:ring-primary/15",
          invalid && "border-danger",
        )}
      >
        <span className={cn("truncate", !valid && "text-ink-faint")}>{valid ? DAY_LABEL.format(dayToDate(value)) : "Pick a date"}</span>
        <Calendar className="size-5 shrink-0 text-ink-soft" aria-hidden />
        <input
          id={id}
          name={name}
          type="date"
          required
          value={value}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker();
            } catch {
              // Older browsers open their picker from the tap itself.
            }
          }}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </div>
      <div className="flex gap-2">
        {[
          { label: "Today", day: today },
          { label: "Yesterday", day: yesterday },
        ].map((chip) => (
          <button
            key={chip.label}
            type="button"
            aria-pressed={value === chip.day}
            onClick={() => onChange(chip.day)}
            className={cn(
              "h-8 rounded-full px-3.5 text-xs font-semibold transition-colors",
              value === chip.day ? "bg-primary-soft text-on-primary-soft ring-1 ring-primary/40" : "bg-muted text-ink-soft hover:bg-line hover:text-ink",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
