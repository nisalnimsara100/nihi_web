"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

const STORAGE_KEY = "nihi:hide-balance";
const CHANGE_EVENT = "nihi:hide-balance-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readHidden() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage can be unavailable (private mode); showing the amount is fine.
    return false;
  }
}

/** Lime hero card with the total balance; the eye button masks amounts on shared screens. */
export function BalanceCard({
  label,
  amount,
  currency,
  footer,
}: {
  label: string;
  amount: string;
  currency: string;
  footer: ReactNode;
}) {
  const hidden = useSyncExternalStore(subscribe, readHidden, () => false);

  function toggle() {
    try {
      localStorage.setItem(STORAGE_KEY, hidden ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-lime p-5 text-on-lime shadow-lg shadow-lime/30 sm:p-6">
      <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/25" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {label}
          <button
            type="button"
            onClick={toggle}
            aria-label={hidden ? "Show balance" : "Hide balance"}
            aria-pressed={hidden}
            className="rounded-full p-1 hover:bg-black/5"
          >
            {hidden ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
        <span className="rounded-full border border-on-lime/25 px-2.5 py-0.5 text-xs font-bold">{currency}</span>
      </div>
      <p className="relative mt-3 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
        {hidden ? "••••••" : amount}
      </p>
      <div className="relative mt-8 text-xs font-medium text-on-lime/75">{footer}</div>
    </div>
  );
}
