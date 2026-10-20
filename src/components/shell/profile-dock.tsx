"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowsLeftRight, Check, Eye } from "@/components/icons";
import { cn } from "@/lib/cn";

export type DockProfile = { id: string; name: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function Face({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", className)}
    >
      {initials(name) || "?"}
    </span>
  );
}

/**
 * Profile switcher as a small floating bubble above the bottom menu. It shows the face of whoever
 * you are looking at; tapping it fans the other profiles out above it, and tapping one switches.
 * While you view someone else the bubble gets an amber ring, an eye badge and a "Read-only" tag, so
 * it can't be mistaken for your own data. It takes no room in the page.
 */
export function ProfileDock({
  me,
  shared,
  viewingId,
  switchTo,
}: {
  me: DockProfile;
  shared: DockProfile[];
  /** Id of the owner being viewed, or null for your own account. */
  viewingId: string | null;
  /** Server action: reads `ownerId` ("me" or an owner id) from the form and switches. */
  switchTo: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const viewing = viewingId ? shared.find((s) => s.id === viewingId) : undefined;
  const current = viewing ?? me;
  const options = [me, ...shared];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open ? <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden /> : null}

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] left-4 z-30 flex flex-col items-start gap-2 lg:bottom-6 lg:left-[17.5rem]">
        <AnimatePresence>
          {open ? (
            <form action={switchTo} onSubmit={() => setOpen(false)} className="flex flex-col items-start gap-2" aria-label="Switch profile">
              {[...options].reverse().map((p, i) => {
                const isMe = p.id === me.id;
                const active = isMe ? !viewing : viewing?.id === p.id;
                return (
                  <motion.button
                    key={p.id}
                    type="submit"
                    name="ownerId"
                    value={isMe ? "me" : p.id}
                    aria-pressed={active}
                    initial={{ opacity: 0, y: 14, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.12 } }}
                    transition={{ type: "spring", stiffness: 520, damping: 30, delay: i * 0.04 }}
                    className={cn(
                      "flex items-center gap-2 rounded-full border bg-surface py-1 pr-4 pl-1 text-left shadow-[0_6px_20px_rgb(20_21_28/0.14)]",
                      active ? "border-primary" : "border-line",
                    )}
                  >
                    <Face name={p.name} className={cn("size-9 text-xs", isMe ? "bg-primary-soft text-on-primary-soft" : "bg-warning-soft text-ink")} />
                    <span className="leading-tight">
                      <span className="block text-sm font-semibold text-ink">{isMe ? "My account" : p.name}</span>
                      <span className="flex items-center gap-1 text-[11px] text-ink-soft">
                        {isMe ? "Edit" : "Read-only"}
                        {active ? <Check className="size-3 text-primary" aria-hidden /> : null}
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </form>
          ) : null}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => setOpen((o) => !o)}
            whileTap={{ scale: 0.92 }}
            aria-expanded={open}
            aria-label={viewing ? `Viewing ${viewing.name}'s finances, read-only. Switch profile` : "Switch profile"}
            className={cn(
              "relative flex size-11 items-center justify-center rounded-full bg-surface shadow-[0_6px_20px_rgb(20_21_28/0.18)] ring-2",
              viewing ? "ring-warning" : "ring-primary/50",
            )}
          >
            <Face name={current.name} className={cn("size-9 text-xs", viewing ? "bg-warning-soft text-ink" : "bg-primary text-on-primary")} />
            <span
              aria-hidden
              className={cn(
                "absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full ring-2 ring-surface",
                viewing ? "bg-warning text-ink" : "bg-primary text-on-primary",
              )}
            >
              {viewing ? <Eye className="size-3" /> : <ArrowsLeftRight className="size-3" />}
            </span>
          </motion.button>
          {viewing && !open ? (
            <span className="rounded-full bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
              {viewing.name.split(/\s+/)[0]} · read-only
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
