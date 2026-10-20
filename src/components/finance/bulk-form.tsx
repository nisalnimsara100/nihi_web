"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { deleteTransactions, restoreTransactions, setTransactionsCategory } from "@/actions/transactions";
import { Trash } from "@/components/icons";
import { notify } from "@/components/toast";
import { Button, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";

type Category = { id: string; name: string; type: "INCOME" | "EXPENSE" };

/**
 * Wraps a selectable transaction list (checkboxes named "ids") with a floating bar to delete the
 * ticked ones, with Undo, or give them a category. The list itself stays a server component.
 */
export function BulkForm({ categories, doneHref, children }: { categories: Category[]; doneHref: string; children: ReactNode }) {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const [count, setCount] = useState(0);
  const [armed, setArmed] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [pending, startTransition] = useTransition();

  const boxes = () => Array.from(formRef.current?.querySelectorAll<HTMLInputElement>('input[name="ids"]') ?? []);
  const selected = () => boxes().filter((b) => b.checked).map((b) => b.value);
  const sync = () => {
    setCount(selected().length);
    setArmed(false);
  };

  function toggleAll() {
    const all = boxes();
    const next = selected().length !== all.length;
    for (const box of all) box.checked = next;
    sync();
  }

  function remove() {
    const ids = selected();
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await deleteTransactions(ids);
      if (result.error || !result.snapshots) {
        notify.error(result.error ?? "Couldn't delete.");
        return;
      }
      const snapshots = result.snapshots;
      notify.undo(result.message ?? "Deleted", "Changed your mind?", async () => {
        const restored = await restoreTransactions(snapshots);
        if (restored.error) notify.error(restored.error);
        else notify.success(restored.message ?? "Restored");
      });
      setCount(0);
      setArmed(false);
    });
  }

  function recategorize() {
    const ids = selected();
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await setTransactionsCategory(ids, categoryId);
      if (result.error) notify.error(result.error);
      else notify.success(result.message ?? "Updated", result.detail);
      for (const box of boxes()) box.checked = false;
      setCount(0);
    });
  }

  return (
    <form ref={formRef} onChange={sync} onSubmit={(e) => e.preventDefault()}>
      {children}

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-40 flex justify-center px-4 lg:bottom-6 lg:pl-64">
        <div className="flex w-full max-w-xl flex-wrap items-center gap-2 rounded-3xl border border-line bg-surface p-2.5 text-sm font-semibold text-ink shadow-[0_8px_30px_rgb(20_21_28/0.14)]">
          <span className="px-2 tabular-nums">{t("{count} selected", { count })}</span>
          <Button type="button" size="sm" variant="ghost" onClick={toggleAll}>
            {t("All / none")}
          </Button>
          <select
            aria-label={t("Category for the selected transactions")}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={cn(inputClass, "h-9 w-auto min-w-0 flex-1 py-0 text-sm sm:flex-none")}
          >
            <option value="">{t("No category")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === "INCOME" ? "income" : "expense"})
              </option>
            ))}
          </select>
          <Button type="button" size="sm" variant="secondary" disabled={count === 0 || pending} onClick={recategorize}>
            {t("Set category")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={armed ? "danger" : "secondary"}
            disabled={count === 0 || pending}
            onClick={() => (armed ? remove() : setArmed(true))}
            onBlur={() => setArmed(false)}
            className={cn(!armed && "text-danger")}
          >
            <Trash className="size-4" aria-hidden />
            {armed ? "Tap again to delete" : "Delete"}
          </Button>
          <Link href={doneHref} className="ml-auto inline-flex h-9 items-center rounded-2xl px-3 text-sm font-semibold text-primary hover:bg-muted">
            {t("Done")}
          </Link>
        </div>
      </div>
    </form>
  );
}
