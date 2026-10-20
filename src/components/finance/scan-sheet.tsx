"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notify } from "@/components/toast";
import { Button, buttonClass, inputClass } from "@/components/ui";
import { Camera, CircleNotch, ImageSquare, X } from "@/components/icons";
import { cn } from "@/lib/cn";
import { todayDay } from "@/lib/dates";
import { formatMoney, parseAmount, toInputAmount } from "@/lib/money";
import { suggestCategory, type CategoryRef, type HistoryRow } from "@/lib/scan/categorize";
import { type Confidence, type ParsedScan, type ScanType } from "@/lib/scan/parse";
import { ScanImageError } from "@/lib/scan/preprocess";
import { readScan } from "@/lib/scan/read";

export type ScanAccount = { id: string; name: string; currency: string };
/** A card the user linked to an account, by its last 4 digits. */
export type ScanCard = { accountId: string; last4: string; name: string };
export type ScanCategory = CategoryRef & { color: string };

export type ScanResult = {
  type: ScanType;
  amount: string;
  accountId: string;
  categoryId: string;
  date: string;
  note: string;
};

/** What the user is about to confirm. Starts as the app's best guess; every field can be changed. */
type Draft = ScanResult;
type Field = keyof Draft;

type Candidate = {
  parsed: ParsedScan;
  draft: Draft;
  accountConfidence: Confidence;
  /** The linked card that picked the account, shown so the user sees why. */
  matchedCard?: ScanCard;
  categoryConfidence: Confidence;
  /** Fields the user has changed, so their badge reads "Confirmed". */
  edited: Partial<Record<Field, true>>;
};

type Review = { raw: string; candidates: Candidate[] };

const TYPES: { value: ScanType; label: string }[] = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfer" },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label])) as Record<ScanType, string>;

/**
 * Picks the account for a scanned payment. A linked card is the strongest clue: paying with
 * card 8663 means the account that card belongs to. Then an account named after the card digits
 * or the bank; otherwise the account that was already selected.
 */
function matchAccount(parsed: ParsedScan, accounts: ScanAccount[], cards: ScanCard[], fallback: string) {
  const { hint, last4 } = parsed.account;
  const lower = (s: string) => s.toLowerCase();
  const card = last4 ? cards.find((c) => c.last4 === last4.slice(-4) && accounts.some((a) => a.id === c.accountId)) : undefined;
  if (card) return { id: card.accountId, confidence: "high" as const, card };
  const byLast4 = last4 ? accounts.find((a) => a.name.includes(last4)) : undefined;
  const byBank = hint
    ? accounts.find((a) => lower(a.name).includes(lower(hint)) || lower(hint).split(" ").some((w) => w.length > 3 && lower(a.name).includes(w)))
    : undefined;
  const found = byLast4 ?? byBank;
  return found ? { id: found.id, confidence: "high" as const, card: undefined } : { id: fallback, confidence: "low" as const, card: undefined };
}

function Badge({ level, edited }: { level: Confidence; edited?: boolean }) {
  const style = edited
    ? "bg-primary text-on-primary"
    : { high: "bg-primary-soft text-on-primary-soft", low: "bg-warning-soft text-ink", missing: "bg-danger/10 text-danger" }[level];
  const label = edited ? "Confirmed" : { high: "Looks right", low: "Check this", missing: "Not found" }[level];
  return <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", style)}>{label}</span>;
}

function FieldRow({ label, htmlFor, level, edited, error, children }: { label: string; htmlFor: string; level: Confidence; edited?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">{label}</label>
        <Badge level={level} edited={edited} />
      </div>
      {children}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function ScanSheet({
  accounts,
  categories,
  history,
  cards = [],
  currentAccountId,
  onApply,
  onClose,
}: {
  accounts: ScanAccount[];
  categories: ScanCategory[];
  history: HistoryRow[];
  cards?: ScanCard[];
  currentAccountId: string;
  onApply: (result: ScanResult) => void;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<"idle" | "prepare" | "read">("idle");
  const [progress, setProgress] = useState(0);
  const [review, setReview] = useState<Review | null>(null);
  const [pick, setPick] = useState(0);
  const [dragging, setDragging] = useState(false);
  const runId = useRef(0);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  /** The best-guess category for a draft's merchant and type, and how much to trust it. */
  const guessCategory = useCallback(
    (merchant: string, type: ScanType, context: string) => {
      const hit = suggestCategory(merchant, history, categories, type, context);
      return { id: hit?.categoryId ?? "", confidence: (hit ? (hit.source === "history" ? "high" : "low") : "missing") as Confidence };
    },
    [history, categories],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const id = ++runId.current;
      setReview(null);
      setProgress(0);
      setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
      setBusy("prepare");
      try {
        const reading = await readScan(
          file,
          todayDay(),
          (p) => id === runId.current && setProgress(p),
          () => setBusy("read"),
          () => id === runId.current,
        );
        if (!reading) return;
        if (reading.results.every((r) => r.amount.minor === null)) {
          notify.error("No amount found", "Try a sharper or closer image, or enter it by hand.");
          setBusy("idle");
          return;
        }
        const candidates = reading.results.map((parsed): Candidate => {
          const type = parsed.type.value;
          const account = matchAccount(parsed, accounts, cards, currentAccountId);
          const category = guessCategory(parsed.merchant.text, type, reading.text);
          return {
            parsed,
            accountConfidence: account.confidence,
            matchedCard: account.card,
            categoryConfidence: category.confidence,
            edited: {},
            draft: {
              type,
              amount: parsed.amount.minor !== null ? toInputAmount(parsed.amount.minor) : "",
              note: parsed.merchant.text,
              date: parsed.date.day,
              accountId: account.id,
              categoryId: category.id,
            },
          };
        });
        setPick(0);
        setReview({ raw: reading.text.trim(), candidates });
        setBusy("idle");
      } catch (error) {
        if (id !== runId.current) return;
        setBusy("idle");
        setPreview(null);
        notify.error("Couldn't read that image", error instanceof ScanImageError ? error.message : "Check your connection and try again.");
      }
    },
    [accounts, cards, currentAccountId, guessCategory],
  );

  // Paste an image from the clipboard (Ctrl/Cmd+V, or long-press Paste on a phone).
  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = Array.from(event.clipboardData?.files ?? []).find((f) => f.type.startsWith("image/"));
      if (file) {
        event.preventDefault();
        void handleFile(file);
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleFile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be chosen again
    if (file) void handleFile(file);
  }

  function reset() {
    runId.current++;
    setReview(null);
    setPreview(null);
    setBusy("idle");
  }

  const current = review?.candidates[pick] ?? null;

  /** Changes one field of the open transaction. A type change re-guesses the category, unless the user chose one. */
  function edit(patch: Partial<Draft>) {
    setReview((r) => {
      if (!r) return r;
      const candidates = r.candidates.map((c, i) => {
        if (i !== pick) return c;
        const draft = { ...c.draft, ...patch };
        const edited = { ...c.edited };
        for (const key of Object.keys(patch) as Field[]) edited[key] = true;
        let categoryConfidence = c.categoryConfidence;
        if (patch.type && patch.type !== c.draft.type && !c.edited.categoryId) {
          const guess = guessCategory(draft.note, patch.type, r.raw);
          draft.categoryId = guess.id;
          categoryConfidence = guess.confidence;
        }
        return { ...c, draft, edited, categoryConfidence };
      });
      return { ...r, candidates };
    });
  }

  const draft = current?.draft;
  const amountMinor = draft ? parseAmount(draft.amount) : null;
  const amountError = draft && (amountMinor === null || amountMinor <= 0) ? "Enter the amount, like 1250.00" : undefined;
  const account = draft ? accounts.find((a) => a.id === draft.accountId) : undefined;
  const currencyMismatch = !!(current?.parsed.amount.currency && account && current.parsed.amount.currency !== account.currency);
  const categoryChoices = draft ? categories.filter((c) => c.type === draft.type) : [];

  function confirm() {
    if (!draft || amountError) return;
    onApply({ ...draft, amount: toInputAmount(amountMinor!) });
    notify.success("Details filled in", "Check them and press Add transaction to save.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Scan a screenshot or bill"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-xl sm:max-w-lg sm:rounded-3xl",
          dragging && "ring-4 ring-primary/40",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Scan screenshot or bill</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        {busy === "idle" && !review ? (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Pick a bank SMS, email or ride receipt screenshot, paste one (Ctrl/Cmd+V), drop it here, or photograph a printed
              bill. It is read on this device and never uploaded. You review everything before it goes in the form.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className={cn(buttonClass("primary", "lg"), "cursor-pointer")}>
                <ImageSquare className="size-5" /> Gallery
                <input type="file" accept="image/*" className="sr-only" onChange={choose} />
              </label>
              <label className={cn(buttonClass("soft", "lg"), "cursor-pointer")}>
                <Camera className="size-5" /> Camera
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={choose} />
              </label>
            </div>
          </div>
        ) : null}

        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimise
          <img src={preview} alt="Selected screenshot" className="mx-auto mb-4 max-h-40 rounded-2xl object-contain" />
        ) : null}

        {busy !== "idle" ? (
          <div className="space-y-2" role="status">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <CircleNotch className="size-4 animate-spin" />
              {busy === "prepare" ? "Preparing image…" : progress > 0 ? `Reading text… ${Math.round(progress * 100)}%` : "Loading reader (first time only)…"}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(5, progress * 100)}%` }} />
            </div>
          </div>
        ) : null}

        {review && current && draft && busy === "idle" ? (
          <div className="space-y-4">
            {review.candidates.length > 1 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">{review.candidates.length} transactions found. Pick one to add.</p>
                <div className="flex flex-col gap-2">
                  {review.candidates.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={i === pick}
                      onClick={() => setPick(i)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl px-4 py-2.5 text-left text-sm font-semibold",
                        i === pick ? "bg-primary-soft text-on-primary-soft ring-2 ring-primary" : "bg-muted text-ink hover:bg-line",
                      )}
                    >
                      <span className="truncate">{c.draft.note || TYPE_LABEL[c.draft.type]}</span>
                      <span className="shrink-0 pl-3 tabular-nums">
                        {formatMoney(parseAmount(c.draft.amount) ?? 0, c.parsed.amount.currency ?? "LKR")} · {c.draft.date}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="text-sm text-ink-soft">Here is what I found. Fix anything that is wrong, then confirm.</p>

            <FieldRow label="Amount" htmlFor="scan-amount" level={currencyMismatch ? "low" : current.parsed.amount.confidence} edited={current.edited.amount} error={amountError}>
              <input
                id="scan-amount"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => edit({ amount: e.target.value })}
                aria-invalid={!!amountError}
                className={cn(inputClass, "tabular-nums")}
              />
            </FieldRow>

            <FieldRow label="Type" htmlFor="scan-type-expense" level={current.parsed.type.confidence} edited={current.edited.type}>
              <div role="radiogroup" aria-label="Type" className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    id={`scan-type-${t.value.toLowerCase()}`}
                    type="button"
                    role="radio"
                    aria-checked={draft.type === t.value}
                    onClick={() => edit({ type: t.value })}
                    className={cn("h-10 rounded-xl text-sm font-semibold transition-colors", draft.type === t.value ? "bg-primary text-on-primary shadow-sm" : "text-ink-soft hover:text-ink")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </FieldRow>

            <FieldRow label="Merchant / note" htmlFor="scan-note" level={current.parsed.merchant.confidence} edited={current.edited.note}>
              <input id="scan-note" value={draft.note} maxLength={500} onChange={(e) => edit({ note: e.target.value })} className={inputClass} />
            </FieldRow>

            <FieldRow label="Date" htmlFor="scan-date" level={current.parsed.date.confidence} edited={current.edited.date}>
              <input id="scan-date" type="date" value={draft.date} onChange={(e) => edit({ date: e.target.value })} className={inputClass} />
            </FieldRow>

            <FieldRow label="Account" htmlFor="scan-account" level={currencyMismatch ? "low" : current.accountConfidence} edited={current.edited.accountId}>
              <select id="scan-account" value={draft.accountId} onChange={(e) => edit({ accountId: e.target.value })} className={inputClass}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                ))}
              </select>
              {current.matchedCard && draft.accountId === current.matchedCard.accountId ? (
                <p className="text-sm text-ink-soft">
                  Card •••• {current.matchedCard.last4}
                  {current.matchedCard.name ? ` (${current.matchedCard.name})` : ""} is linked to this account, so the amount will come out of it.
                </p>
              ) : null}
              {currencyMismatch ? (
                <p className="text-sm text-danger">The image shows {current.parsed.amount.currency} but {account?.name} uses {account?.currency}.</p>
              ) : null}
            </FieldRow>

            {draft.type !== "TRANSFER" ? (
              <FieldRow label="Category" htmlFor="scan-category" level={current.categoryConfidence} edited={current.edited.categoryId}>
                <select id="scan-category" value={draft.categoryId} onChange={(e) => edit({ categoryId: e.target.value })} className={inputClass}>
                  <option value="">None</option>
                  {categoryChoices.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FieldRow>
            ) : null}

            <details className="rounded-2xl bg-muted px-4 py-2 text-sm">
              <summary className="cursor-pointer font-semibold text-ink">What I read</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-ink-soft">{review.raw || "(nothing)"}</pre>
            </details>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={reset}>Scan again</Button>
              <Button className="flex-1" onClick={confirm} disabled={!!amountError}>Confirm details</Button>
            </div>
            <p className="text-center text-xs text-ink-soft">Nothing is saved yet. You can still change things in the form.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
