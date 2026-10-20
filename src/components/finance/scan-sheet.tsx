"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notify } from "@/components/toast";
import { Button, buttonClass } from "@/components/ui";
import { Camera, CircleNotch, ImageSquare, X } from "@/components/icons";
import { cn } from "@/lib/cn";
import { todayDay } from "@/lib/dates";
import { formatMoney, toInputAmount } from "@/lib/money";
import { suggestCategory, type CategoryRef, type HistoryRow } from "@/lib/scan/categorize";
import { type Confidence, type ParsedScan, type ScanType } from "@/lib/scan/parse";
import { ScanImageError } from "@/lib/scan/preprocess";
import { readScan } from "@/lib/scan/read";

export type ScanAccount = { id: string; name: string; currency: string };
export type ScanCategory = CategoryRef & { color: string };

export type ScanResult = {
  type: ScanType;
  amount: string;
  accountId: string;
  categoryId: string;
  date: string;
  note: string;
};

type Candidate = {
  parsed: ParsedScan;
  type: ScanType;
  accountId: string;
  accountConfidence: Confidence;
  category: { id: string; name: string } | null;
  note: string;
};

type Review = { raw: string; candidates: Candidate[] };

const TYPE_LABEL: Record<ScanType, string> = { EXPENSE: "Expense", INCOME: "Income", TRANSFER: "Transfer" };

function matchAccount(parsed: ParsedScan, accounts: ScanAccount[], fallback: string) {
  const { hint, last4 } = parsed.account;
  const lower = (s: string) => s.toLowerCase();
  const byLast4 = last4 ? accounts.find((a) => a.name.includes(last4)) : undefined;
  const byBank = hint
    ? accounts.find((a) => lower(a.name).includes(lower(hint)) || lower(hint).split(" ").some((w) => w.length > 3 && lower(a.name).includes(w)))
    : undefined;
  const found = byLast4 ?? byBank;
  return found ? { id: found.id, confidence: "high" as const } : { id: fallback, confidence: "low" as const };
}

function Badge({ level }: { level: Confidence }) {
  const style = {
    high: "bg-primary-soft text-on-primary-soft",
    low: "bg-warning-soft text-ink",
    missing: "bg-danger/10 text-danger",
  }[level];
  const label = { high: "Looks right", low: "Check this", missing: "Not found" }[level];
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", style)}>{label}</span>;
}

function Row({ label, value, level }: { label: string; value: string; level: Confidence }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-soft">{label}</p>
        <p className="truncate text-sm font-semibold text-ink">{value || "—"}</p>
      </div>
      <Badge level={level} />
    </div>
  );
}

export function ScanSheet({
  accounts,
  categories,
  history,
  currentAccountId,
  onApply,
  onClose,
}: {
  accounts: ScanAccount[];
  categories: ScanCategory[];
  history: HistoryRow[];
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
          const account = matchAccount(parsed, accounts, currentAccountId);
          const suggestion = suggestCategory(parsed.merchant.text, history, categories, type);
          const category = suggestion ? categories.find((c) => c.id === suggestion.categoryId) ?? null : null;
          return {
            parsed,
            type,
            accountId: account.id,
            accountConfidence: account.confidence,
            category: category ? { id: category.id, name: category.name } : null,
            note: parsed.merchant.text,
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
    [accounts, categories, history, currentAccountId],
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

  function apply() {
    if (!current || current.parsed.amount.minor === null) return;
    onApply({
      type: current.type,
      amount: toInputAmount(current.parsed.amount.minor),
      accountId: current.accountId,
      categoryId: current.category?.id ?? "",
      date: current.parsed.date.day,
      note: current.note,
    });
    notify.success("Details filled in", "Check them and save.");
  }

  const account = current ? accounts.find((a) => a.id === current.accountId) : undefined;
  const currencyMismatch = !!(current?.parsed.amount.currency && account && current.parsed.amount.currency !== account.currency);

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
              Pick a bank SMS or email screenshot, paste one (Ctrl/Cmd+V), drop it here, or photograph a printed bill. It is
              read on this device and never uploaded.
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
          <img src={preview} alt="Selected screenshot" className="mx-auto mb-4 max-h-48 rounded-2xl object-contain" />
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

        {review && current && busy === "idle" ? (
          <div className="space-y-3">
            {review.candidates.length > 1 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">{review.candidates.length} transactions found. Pick one to fill in.</p>
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
                      <span className="truncate">{c.note || TYPE_LABEL[c.type]}</span>
                      <span className="shrink-0 pl-3 tabular-nums">
                        {formatMoney(c.parsed.amount.minor ?? 0, c.parsed.amount.currency ?? "LKR")} · {c.parsed.date.day}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="divide-y divide-line rounded-2xl bg-muted px-4">
              <Row
                label="Amount"
                value={current.parsed.amount.minor !== null ? formatMoney(current.parsed.amount.minor, current.parsed.amount.currency ?? account?.currency ?? "LKR") : ""}
                level={currencyMismatch ? "low" : current.parsed.amount.confidence}
              />
              <Row label="Type" value={TYPE_LABEL[current.type]} level={current.parsed.type.confidence} />
              <Row label="Merchant" value={current.note} level={current.parsed.merchant.confidence} />
              <Row label="Date" value={current.parsed.date.day} level={current.parsed.date.confidence} />
              <Row label="Account" value={account?.name ?? ""} level={current.accountConfidence} />
              <Row label="Category" value={current.category?.name ?? ""} level={current.category ? "low" : "missing"} />
            </div>
            {currencyMismatch ? (
              <p className="text-sm text-danger">The image shows {current.parsed.amount.currency} but {account?.name} uses {account?.currency}.</p>
            ) : null}
            <details className="rounded-2xl bg-muted px-4 py-2 text-sm">
              <summary className="cursor-pointer font-semibold text-ink">What I read</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-ink-soft">{review.raw || "(nothing)"}</pre>
            </details>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={reset}>Scan again</Button>
              <Button className="flex-1" onClick={apply}>Use these details</Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
