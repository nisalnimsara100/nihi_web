/**
 * Transactions filled in while the phone has no connection are kept here, in the browser, and added
 * when it is back online (see OfflineSync). Only the form's own fields are stored: names and values.
 */
const KEY = "nihi:offline-queue";
const EVENT = "nihi:offline-queue-change";

export type QueuedTransaction = { id: string; entries: [string, string][]; label: string };

export function readQueue(): QueuedTransaction[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(queue: QueuedTransaction[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    // Storage full or blocked: the entry is lost, and the caller already told the user it was saved only if this succeeded.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Stores an entry. Returns false when the browser would not keep it. */
export function enqueue(entries: [string, string][], label: string): boolean {
  const entry: QueuedTransaction = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, entries, label };
  write([...readQueue(), entry]);
  return readQueue().some((q) => q.id === entry.id);
}

export function remove(id: string) {
  write(readQueue().filter((q) => q.id !== id));
}

export function subscribeQueue(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Raw stored text, so useSyncExternalStore sees a stable value between changes. */
export function queueSnapshot(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}
