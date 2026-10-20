"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Eye, EyeSlash } from "@/components/icons";

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

/** Balance block for the blue hero; the eye button masks amounts on shared screens. */
export function BalanceCard({ label, amount, footer }: { label: string; amount: string; footer: ReactNode }) {
  const hidden = useSyncExternalStore(subscribe, readHidden, () => false);

  function toggle() {
    try {
      localStorage.setItem(STORAGE_KEY, hidden ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-white/85">
        {label}
        <button
          type="button"
          onClick={toggle}
          aria-label={hidden ? "Show balance" : "Hide balance"}
          aria-pressed={hidden}
          className="rounded-full bg-white/15 p-1 hover:bg-white/25"
        >
          {hidden ? <EyeSlash className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
        </button>
      </div>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-white tabular-nums sm:text-5xl">
        {hidden ? "••••••" : amount}
      </p>
      <div className="mt-2 text-sm text-white/65">{footer}</div>
    </div>
  );
}
