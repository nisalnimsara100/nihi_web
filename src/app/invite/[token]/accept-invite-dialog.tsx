"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, CircleNotch, Eye, Lock } from "@/components/icons";
import { Button } from "@/components/ui";
import { useT } from "@/lib/i18n/client";

function ConnectButton() {
  const t = useT();
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? <CircleNotch className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />}
      {t("Connect")}
    </Button>
  );
}

/**
 * Opens by itself when the invited person lands on the link while signed in with the invited
 * email. Nothing is shared until they press Connect, and "Not now" leaves the invite pending.
 */
export function AcceptInviteDialog({
  ownerName,
  accept,
}: {
  ownerName: string;
  /** Server action that accepts the invite and redirects to the dashboard. */
  accept: () => Promise<void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="mt-6">
        <Button type="button" className="w-full" onClick={() => setOpen(true)}>
          {t("Review and connect")}
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-title"
            className="w-full rounded-t-3xl bg-surface p-6 shadow-xl sm:max-w-md sm:rounded-3xl"
          >
            <h2 id="connect-title" className="text-xl font-bold tracking-tight text-ink">
              {t("Connect with {name}?", { name: ownerName })}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink">
              <li className="flex gap-3">
                <Eye className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span>{t("You will be able to see {name}'s accounts, transactions and reports.", { name: ownerName })}</span>
              </li>
              <li className="flex gap-3">
                <Lock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span>{t("It is read-only: you can't add, change or delete anything.")}</span>
              </li>
              <li className="flex gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span>{t("You can leave at any time from Settings, and {name} can remove your access too.", { name: ownerName })}</span>
              </li>
            </ul>
            <form action={accept} className="mt-6 flex gap-2">
              <Link
                href="/dashboard"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-ink-soft transition-colors hover:bg-muted hover:text-ink"
              >
                {t("Not now")}
              </Link>
              <ConnectButton />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
