"use client";

import { useEffect, useState } from "react";
import { Check, Eye, X } from "@/components/icons";
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

function Face({ name, active, size = "md" }: { name: string; active?: boolean; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-on-primary-soft ring-2 ring-surface",
        size === "lg" ? "size-12 text-base" : "size-9 text-xs",
        active && "bg-primary text-on-primary",
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}

/**
 * Profile switcher. A small floating pill above the bottom menu shows who you are looking at, as
 * overlapping avatars; tapping it opens a sheet to switch between your own account and the accounts
 * shared with you. It takes no space in the page, and while you view someone else it turns amber and
 * says "read-only" so you never mistake it for your own data.
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
  const everyone = [me, ...shared];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={viewing ? `Viewing ${viewing.name}'s finances. Switch profile` : "Switch profile"}
        className={cn(
          "fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] left-4 z-30 flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 shadow-[0_8px_24px_rgb(20_21_28/0.14)] transition-colors lg:bottom-6 lg:left-[17.5rem]",
          viewing ? "border-warning bg-warning-soft text-ink" : "border-line bg-surface text-ink",
        )}
      >
        <span className="flex -space-x-2.5">
          {(viewing ? [viewing, me] : [me, ...shared.slice(0, 2)]).map((p, i) => (
            <Face key={p.id} name={p.name} active={i === 0} />
          ))}
        </span>
        <span className="text-sm font-semibold">{viewing ? `${viewing.name.split(/\s+/)[0]} · read-only` : "Profiles"}</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-sheet-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-sm sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="profile-sheet-title" className="text-lg font-bold text-ink">
                Whose finances?
              </h2>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>

            <form action={switchTo} className="space-y-2">
              {everyone.map((p) => {
                const isMe = p.id === me.id;
                const active = isMe ? !viewing : viewing?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="submit"
                    name="ownerId"
                    value={isMe ? "me" : p.id}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors",
                      active ? "bg-primary-soft ring-2 ring-primary" : "bg-muted hover:bg-line",
                    )}
                  >
                    <Face name={p.name} active={active} size="lg" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-ink">{isMe ? "My account" : p.name}</span>
                      <span className="flex items-center gap-1 text-xs text-ink-soft">
                        {isMe ? (
                          "You can add and change things"
                        ) : (
                          <>
                            <Eye className="size-3.5" aria-hidden /> Shared with you · read-only
                          </>
                        )}
                      </span>
                    </span>
                    {active ? <Check className="size-5 shrink-0 text-primary" aria-hidden /> : null}
                  </button>
                );
              })}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
