"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { notify } from "@/components/toast";
import { enqueue } from "@/lib/offline-queue";
import { saveTransaction } from "@/actions/transactions";
import { SimilarWarning } from "@/components/finance/similar-warning";
import { parseAmount } from "@/lib/money";
import { DeleteTransactionButton } from "@/components/finance/delete-transaction-button";
import { ScanSheet, type ScanCard, type ScanResult } from "@/components/finance/scan-sheet";
import { CreditCard, Prohibit, Scan } from "@/components/icons";
import { cardLabel } from "@/lib/card-networks";
import type { HistoryRow } from "@/lib/scan/categorize";
import { DateField, SubmitButton } from "@/components/form-bits";
import { useActionForm } from "@/components/use-action-form";
import { buttonClass, Card, Field, inputClass } from "@/components/ui";
import type { Enums } from "@/lib/database.types";
import { CategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/cn";

type TransactionType = Enums<"TransactionType">;

type Option = { id: string; name: string; color: string };
type AccountOption = Option & { currency: string };
type CategoryOption = Option & { type: "INCOME" | "EXPENSE"; icon: string };

export type TransactionFormValues = {
  id?: string;
  type: TransactionType;
  amount: string;
  toAmount: string;
  accountId: string;
  toAccountId: string;
  categoryId: string;
  cardId: string;
  date: string;
  note: string;
  tagIds: string[];
};

const TYPE_TABS: { value: TransactionType; label: string }[] = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfer" },
];

export function TransactionForm({
  initial,
  accounts,
  categories,
  tags,
  history = [],
  cards = [],
  autoScan = false,
}: {
  initial: TransactionFormValues;
  accounts: AccountOption[];
  categories: CategoryOption[];
  tags: Option[];
  /** Past notes and categories, used to guess the category of a scanned receipt. */
  history?: HistoryRow[];
  /** Linked cards, so a scanned card number can pick the account. */
  cards?: ScanCard[];
  /** Open the scan sheet straight away (the home screen's Scan shortcut). */
  autoScan?: boolean;
}) {
  const { state, pending, onSubmit } = useActionForm(saveTransaction);
  const [type, setType] = useState<TransactionType>(initial.type);
  const [accountId, setAccountId] = useState(initial.accountId);
  const [toAccountId, setToAccountId] = useState(initial.toAccountId);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [tagIds, setTagIds] = useState(initial.tagIds);
  const [scanOpen, setScanOpen] = useState(autoScan && !initial.id);
  const [date, setDate] = useState(initial.date);
  const [cardId, setCardId] = useState(initial.cardId);
  const [amountText, setAmountText] = useState(initial.amount);
  // The amount, date and note inputs are uncontrolled; a new key remounts them with scanned values.
  const [scanned, setScanned] = useState({ n: 0, amount: initial.amount, date: initial.date, note: initial.note });
  const errors = state.fieldErrors ?? {};

  /** With no connection a new transaction is kept on the phone and added later (see OfflineSync). */
  function submit(event: FormEvent<HTMLFormElement>) {
    if (initial.id || navigator.onLine) {
      onSubmit(event);
      return;
    }
    event.preventDefault();
    const entries = [...new FormData(event.currentTarget).entries()].filter((e): e is [string, string] => typeof e[1] === "string");
    const label = `${entries.find(([k]) => k === "note")?.[1] || type.toLowerCase()} ${amountText}`.trim();
    if (!enqueue(entries, label)) {
      notify.error("Couldn't save it on this phone", "Your browser blocked storage. Try again when you're online.");
      return;
    }
    notify.success("Saved on this phone", "It will be added when you're back online.");
    setAmountText("");
    setScanned((s) => ({ n: s.n + 1, amount: "", date: initial.date, note: "" }));
    setDate(initial.date);
  }

  const isTransfer = type === "TRANSFER";
  const visibleCategories = categories.filter((c) => c.type === type);
  const from = accounts.find((a) => a.id === accountId);
  const accountCards = cards.filter((c) => c.accountId === accountId);
  const to = accounts.find((a) => a.id === toAccountId);
  const crossCurrency = isTransfer && from && to && from.currency !== to.currency;

  function changeType(next: TransactionType) {
    setType(next);
    if (!categories.some((c) => c.id === categoryId && c.type === next)) {
      setCategoryId(categories.find((c) => c.type === next)?.id ?? "");
    }
  }

  function applyScan(r: ScanResult) {
    setType(r.type);
    setAccountId(r.accountId);
    setCategoryId(r.type === "TRANSFER" ? "" : r.categoryId);
    if (r.type === "TRANSFER" && (!toAccountId || toAccountId === r.accountId)) {
      setToAccountId(accounts.find((a) => a.id !== r.accountId)?.id ?? "");
    }
    setDate(r.date);
    setAmountText(r.amount);
    setCardId(r.cardId);
    setScanned((s) => ({ n: s.n + 1, amount: r.amount, date: r.date, note: r.note }));
    setScanOpen(false);
  }

  function toggleTag(id: string) {
    setTagIds((ids) => (ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id]));
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={submit} className="space-y-5" noValidate>
        {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
        <input type="hidden" name="type" value={type} />
        {tagIds.map((id) => (
          <input key={id} type="hidden" name="tags" value={id} />
        ))}

        {!initial.id ? (
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className={buttonClass("soft", "md", "w-full")}
          >
            <Scan className="size-5" /> Scan screenshot or bill
          </button>
        ) : null}

        <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="radio"
              aria-checked={type === tab.value}
              onClick={() => changeType(tab.value)}
              className={cn(
                "h-11 rounded-xl text-sm font-semibold transition-colors",
                type === tab.value
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>


        <Field label={crossCurrency ? `Amount sent (${from.currency})` : "Amount"} htmlFor="amount" error={errors.amount}>
          <div className="relative">
            <input
              key={`amount-${scanned.n}`}
              id="amount"
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              defaultValue={scanned.amount}
              onChange={(e) => setAmountText(e.target.value)}
              autoFocus={!initial.id}
              aria-invalid={!!errors.amount}
              className={cn(inputClass, "h-14 pr-16 text-2xl font-semibold tabular-nums sm:text-2xl")}
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-ink-soft">
              {from?.currency}
            </span>
          </div>
        </Field>

        {!initial.id ? <SimilarWarning type={type} amount={parseAmount(amountText)} accountId={accountId} day={date} /> : null}

        <div className={cn("grid gap-4", isTransfer && "sm:grid-cols-2")}>
          <Field label={isTransfer ? "From account" : "Account"} htmlFor="accountId" error={errors.accountId}>
            <select
              id="accountId"
              name="accountId"
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                // A card belongs to one account, so it cannot stay selected on another.
                if (!cards.some((c) => c.id === cardId && c.accountId === e.target.value)) setCardId("");
              }}
              className={inputClass}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </Field>

          {isTransfer ? (
            <Field label="To account" htmlFor="toAccountId" error={errors.toAccountId}>
              <select
                id="toAccountId"
                name="toAccountId"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                aria-invalid={!!errors.toAccountId}
                className={inputClass}
              >
                <option value="">Choose account</option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
              </select>
            </Field>
          ) : null}
        </div>

        {!isTransfer && accountCards.length > 0 ? (
          <fieldset>
            <legend className="mb-2 block text-sm font-semibold text-ink">{type === "INCOME" ? "Received on card" : "Paid with card"}</legend>
            <input type="hidden" name="cardId" value={cardId} />
            <div role="radiogroup" aria-label="Card" className="flex flex-wrap gap-2">
              {[{ id: "", label: "No card" }, ...accountCards.map((c) => ({ id: c.id, label: cardLabel(c.network, c.last4) }))].map((o) => (
                <button
                  key={o.id || "none"}
                  type="button"
                  role="radio"
                  aria-checked={cardId === o.id}
                  onClick={() => setCardId(o.id)}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold tabular-nums transition-colors",
                    cardId === o.id ? "bg-primary-soft text-on-primary-soft ring-2 ring-primary" : "bg-muted text-ink hover:bg-line",
                  )}
                >
                  {o.id ? <CreditCard className="size-4" aria-hidden /> : null}
                  {o.label}
                </button>
              ))}
            </div>
            {errors.cardId?.length ? <p className="mt-1.5 text-sm text-danger">{errors.cardId[0]}</p> : null}
          </fieldset>
        ) : null}

        {!isTransfer ? (
          <fieldset>
            <legend className="mb-2 block text-sm font-semibold text-ink">Category</legend>
            <input type="hidden" name="categoryId" value={categoryId} />
            <div role="radiogroup" aria-label="Category" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {[...visibleCategories, { id: "", name: "None", icon: "", color: "#8a8984" }].map((c) => {
                const selected = categoryId === c.id;
                return (
                  <button
                    key={c.id || "none"}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCategoryId(c.id)}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 transition-colors",
                      selected ? "bg-primary-soft text-on-primary-soft ring-2 ring-primary" : "bg-muted text-ink hover:bg-line",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "relative flex size-10 items-center justify-center rounded-xl",
                        selected ? "bg-primary text-on-primary" : "bg-surface text-ink-soft",
                      )}
                    >
                      {c.id ? <CategoryIcon name={c.icon} className="size-5" /> : <Prohibit className="size-5" />}
                      {c.id ? (
                        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-muted" style={{ background: c.color }} />
                      ) : null}
                    </span>
                    <span className="w-full truncate text-center text-xs font-semibold">{c.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.categoryId?.length ? <p className="mt-1.5 text-sm text-danger">{errors.categoryId[0]}</p> : null}
          </fieldset>
        ) : null}

        {crossCurrency ? (
          <Field
            label={`Amount received (${to.currency})`}
            htmlFor="toAmount"
            error={errors.toAmount}
            hint="Leave empty to use the same number as the amount sent."
          >
            <input
              id="toAmount"
              name="toAmount"
              inputMode="decimal"
              placeholder="0.00"
              defaultValue={initial.toAmount}
              aria-invalid={!!errors.toAmount}
              className={cn(inputClass, "tabular-nums")}
            />
          </Field>
        ) : null}

        <Field label="Date" htmlFor="date" error={errors.date}>
          <DateField id="date" name="date" value={date} onChange={setDate} invalid={!!errors.date} />
        </Field>

        {tags.length > 0 ? (
          <fieldset>
            <legend className="mb-2 block text-sm font-semibold text-ink">Tags</legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const on = tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                      on
                        ? "border-primary/40 bg-primary-soft text-on-primary-soft"
                        : "border-transparent bg-muted text-ink hover:bg-line",
                    )}
                  >
                    <span className="size-2 rounded-full" style={{ background: tag.color }} aria-hidden />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <Field label="Note" htmlFor="note" error={errors.note}>
          <textarea
            key={`note-${scanned.n}`}
            id="note"
            name="note"
            rows={2}
            maxLength={500}
            defaultValue={scanned.note}
            placeholder="Optional"
            className={cn(inputClass, "h-auto py-2.5")}
          />
        </Field>

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-start sm:justify-between">
          {initial.id ? (
            <DeleteTransactionButton id={initial.id} />
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Link href="/transactions" className={buttonClass("ghost")}>
              Cancel
            </Link>
            <SubmitButton pending={pending}>{initial.id ? "Save changes" : "Add transaction"}</SubmitButton>
          </div>
        </div>
      </form>
      {scanOpen ? (
        <ScanSheet
          accounts={accounts}
          categories={categories}
          history={history}
          cards={cards}
          currentAccountId={accountId}
          onApply={applyScan}
          onClose={() => setScanOpen(false)}
        />
      ) : null}
    </Card>
  );
}
