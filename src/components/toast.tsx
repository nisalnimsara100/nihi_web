"use client";

import { useEffect } from "react";
import { GooeyToaster, gooeyToast } from "goey-toast";
import { tr } from "@/lib/i18n/client";
import type { Flash } from "@/lib/flash";

/**
 * Every message in the app goes through `notify`, so toasts look and time the
 * same everywhere. Client components only: Server Actions report back through
 * the action state (`message`, `detail`, `error`) or `flash()` in lib/flash.ts,
 * and the components below turn those into toasts.
 */
export type ToastType = "success" | "error" | "info" | "warning";

const OPTIONS = {
  success: { preset: "bouncy", duration: 3800 },
  info: { preset: "smooth", duration: 4200 },
  warning: { preset: "snappy", duration: 5500 },
  // Errors stay longer: people need time to read what went wrong.
  error: { preset: "snappy", duration: 6500 },
} as const;

function show(type: ToastType, title: string, description?: string) {
  const { preset, duration } = OPTIONS[type];
  gooeyToast[type](tr(title)!, { description: tr(description), preset, duration, showProgress: true });
}

/** A success message with an Undo button that stays a little longer than usual. */
function undo(title: string, description: string | undefined, onUndo: () => void) {
  gooeyToast.success(tr(title)!, {
    description: tr(description),
    preset: "smooth",
    duration: 9000,
    showProgress: true,
    action: { label: tr("Undo")!, onClick: onUndo },
  });
}

export const notify = {
  undo,
  success: (title: string, description?: string) => show("success", title, description),
  info: (title: string, description?: string) => show("info", title, description),
  warning: (title: string, description?: string) => show("warning", title, description),
  error: (title: string, description?: string) => show("error", title, description),
};

/** Mount once in the root layout. */
export function AppToaster() {
  return <GooeyToaster position="top-center" offset="16px" closeButton="top-right" />;
}

const FLASH_COOKIE = "nihi_flash";
const shown = new Set<string>();

/**
 * Shows a message that a Server Action left in the flash cookie before it
 * redirected (see lib/flash.ts). The id keeps a message from showing twice
 * when the server sends the same one again.
 */
export function FlashToast({ flash }: { flash: Flash }) {
  useEffect(() => {
    if (shown.has(flash.id)) return;
    shown.add(flash.id);
    // The cookie is single-use: clear it so a reload doesn't repeat the toast.
    document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;
    notify[flash.type](flash.title, flash.description);
  }, [flash]);
  return null;
}
