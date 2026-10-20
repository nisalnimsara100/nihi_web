"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { syncQueuedTransaction } from "@/actions/transactions";
import { Button } from "@/components/ui";
import { notify } from "@/components/toast";
import { queueSnapshot, readQueue, remove, subscribeQueue } from "@/lib/offline-queue";

/** Registers the service worker (production only) so the app can be installed and shows an offline page. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Shows a small pill while offline or while entries wait to be added, and adds the queued
 * transactions as soon as the connection is back.
 */
export function OfflineSync() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const raw = useSyncExternalStore(subscribeQueue, queueSnapshot, () => "[]");
  const waiting = (() => {
    try {
      return (JSON.parse(raw) as unknown[]).length;
    } catch {
      return 0;
    }
  })();
  const busy = useRef(false);

  useEffect(() => {
    if (!online || waiting === 0 || busy.current) return;
    busy.current = true;
    (async () => {
      let added = 0;
      for (const item of readQueue()) {
        try {
          const result = await syncQueuedTransaction(item.entries);
          if (result.error) notify.error(`Couldn't add ${item.label}`, result.error);
          else added++;
          remove(item.id);
        } catch {
          // Still no real connection: keep this one and everything after it for the next try.
          break;
        }
      }
      busy.current = false;
      if (added > 0) notify.success(added === 1 ? "Offline transaction added" : `${added} offline transactions added`);
    })();
  }, [online, waiting]);

  if (online && waiting === 0) return null;
  return (
    <div
      role="status"
      className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 z-50 -translate-x-1/2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink shadow-[0_6px_20px_rgb(20_21_28/0.14)]"
    >
      {online ? `Adding ${waiting} offline…` : waiting > 0 ? `Offline · ${waiting} waiting to be added` : "You're offline"}
    </div>
  );
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function subscribeInstalled(onChange: () => void) {
  window.addEventListener("appinstalled", onChange);
  return () => window.removeEventListener("appinstalled", onChange);
}

/** An Install button where the browser offers one, and the Add to Home Screen steps on iPhone. */
export function InstallApp() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const installed = useSyncExternalStore(
    subscribeInstalled,
    () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => false,
  );
  const ios = useSyncExternalStore(
    () => () => {},
    () => /iphone|ipad|ipod/i.test(navigator.userAgent),
    () => false,
  );

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) return <p className="text-sm text-ink-soft">NiHi is installed on this device.</p>;
  if (event) {
    return (
      <Button
        onClick={async () => {
          await event.prompt();
          setEvent(null);
        }}
      >
        Install NiHi
      </Button>
    );
  }
  if (ios) {
    return (
      <p className="text-sm text-ink-soft">
        In Safari, tap the <span className="font-semibold text-ink">Share</span> button, then <span className="font-semibold text-ink">Add to Home Screen</span>.
      </p>
    );
  }
  return <p className="text-sm text-ink-soft">Open this page in Chrome, Edge or Safari to install NiHi. It may already be installed.</p>;
}
