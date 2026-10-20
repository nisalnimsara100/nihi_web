"use client";

import { useState, useTransition, type ComponentProps } from "react";
import { Reorder } from "framer-motion";
import { reorderAccounts } from "@/actions/accounts";
import { AccountCardFace } from "@/components/finance/account-card";
import { Check } from "@/components/icons";
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
 * The active accounts. "Reorder" switches to a plain list where each card can be dragged
 * up or down; "Done" saves the new order. Dragging is only on in that mode, so scrolling and
 * tapping a card to open it keep working the rest of the time.
 */
export function WalletList({ items, readOnly }: { items: WalletItem[]; readOnly: boolean }) {
  const [editing, setEditing] = useState(false);
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
      setEditing(false);
    });
  }

  const canReorder = !readOnly && items.length > 1;

  return (
    <div>
      {canReorder ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-soft">{editing ? "Drag a card up or down to move it." : ""}</p>
          {editing ? (
            <Button size="sm" onClick={done} disabled={saving}>
              <Check className="size-4" aria-hidden /> Done
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => { setOrder(ids); setEditing(true); }}>
              Reorder
            </Button>
          )}
        </div>
      ) : null}

      {editing ? (
        <Reorder.Group axis="y" values={ids} onReorder={setOrder} className="mx-auto flex max-w-md flex-col gap-3 sm:mx-0">
          {ids.map((id) => (
            <Reorder.Item
              key={id}
              value={id}
              whileDrag={{ scale: 1.03, boxShadow: "0 18px 40px rgb(20 21 28 / 0.25)", zIndex: 10 }}
              className="relative cursor-grab touch-none rounded-3xl active:cursor-grabbing"
            >
              {/* pointer-events-none keeps the card from being a link while it is being moved */}
              <div className="pointer-events-none select-none">
                <AccountCardFace {...byId.get(id)!.face} className="shadow-lg shadow-primary/10" />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="mx-auto max-w-md sm:mx-0 sm:grid sm:max-w-none sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {ids.map((id, i) => (
            <AccountTile key={id} item={byId.get(id)!} index={i} stacked readOnly={readOnly} />
          ))}
        </div>
      )}
    </div>
  );
}
