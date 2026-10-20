"use client";

import { useState, useTransition, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { Reorder } from "framer-motion";
import { reorderAccounts } from "@/actions/accounts";
import { AccountCardFace } from "@/components/finance/account-card";
import { Check, DragHandle } from "@/components/icons";
import { notify } from "@/components/toast";
import { Button, MaybeLink } from "@/components/ui";
import { cn } from "@/lib/cn";

type Face = ComponentProps<typeof AccountCardFace>;
export type WalletItem = { id: string; face: Face };

/** One account card. On phones the cards overlap so each shows its top strip, like a wallet. */
export function AccountTile({ item, index, stacked, readOnly }: { item: WalletItem; index: number; stacked: boolean; readOnly: boolean }) {
  return (
    <MaybeLink
      href={readOnly ? undefined : `/accounts/${item.id}`}
      className={cn("group relative block", !readOnly && "transition-transform hover:-translate-y-1", stacked && index > 0 && "-mt-28 sm:mt-0")}
      style={{ zIndex: index }}
    >
      <AccountCardFace {...item.face} className="shadow-[0_-6px_24px_rgb(20_21_28/0.14)] sm:shadow-lg sm:shadow-primary/10" />
    </MaybeLink>
  );
}

/**
 * The active accounts. In reorder mode (`editing`, switched on by the header button) they become
 * a plain list where each card can be dragged up or down, and a floating bar offers Done to save.
 * Dragging is only on in that mode, so scrolling and tapping a card to open it work the rest of the time.
 */
export function WalletList({ items, readOnly, editing }: { items: WalletItem[]; readOnly: boolean; editing: boolean }) {
  const router = useRouter();
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [saving, startSaving] = useTransition();
  const byId = new Map(items.map((i) => [i.id, i]));
  // Accounts added or removed elsewhere while this page is open.
  const ids = [...order.filter((id) => byId.has(id)), ...items.map((i) => i.id).filter((id) => !order.includes(id))];

  function done() {
    startSaving(async () => {
      const result = await reorderAccounts(ids);
      if (result.error) {
        notify.error(result.error);
        return;
      }
      notify.success("Wallet order saved");
      router.replace("/accounts");
    });
  }

  if (!editing) {
    return (
      <div className="mx-auto max-w-md sm:mx-0 sm:grid sm:max-w-none sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {ids.map((id, i) => (
          <AccountTile key={id} item={byId.get(id)!} index={i} stacked readOnly={readOnly} />
        ))}
      </div>
    );
  }

  return (
    <>
      <Reorder.Group axis="y" values={ids} onReorder={setOrder} className="mx-auto flex max-w-md flex-col gap-3 pb-24 sm:mx-0">
        {ids.map((id) => (
          <Reorder.Item
            key={id}
            value={id}
            whileDrag={{ scale: 1.03, boxShadow: "0 18px 40px rgb(20 21 28 / 0.25)", zIndex: 10 }}
            className="wiggle relative cursor-grab touch-none rounded-3xl active:cursor-grabbing"
          >
            {/* pointer-events-none keeps the card from being a link while it is being moved */}
            <div className="pointer-events-none relative select-none">
              <AccountCardFace {...byId.get(id)!.face} className="shadow-lg shadow-primary/10" />
              <span aria-hidden className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/25 p-1 text-white backdrop-blur-sm">
                <DragHandle className="size-5" />
              </span>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* A floating bar above the bottom navigation, so Done is always in reach. */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-40 flex justify-center px-4 lg:bottom-6 lg:pl-64">
        <div className="flex items-center gap-3 rounded-full bg-ink py-1.5 pr-1.5 pl-5 text-sm font-semibold text-surface shadow-xl">
          <span>Drag cards to reorder</span>
          <Button size="sm" onClick={done} disabled={saving} className="rounded-full">
            <Check className="size-4" aria-hidden /> Done
          </Button>
        </div>
      </div>
    </>
  );
}
