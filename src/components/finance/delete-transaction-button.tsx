"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTransaction, restoreTransactions } from "@/actions/transactions";
import { CircleNotch, Trash } from "@/components/icons";
import { notify } from "@/components/toast";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Delete with a second tap to confirm, then back to the list with an Undo message. */
export function DeleteTransactionButton({ id }: { id: string }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={armed ? "danger" : "secondary"}
      disabled={pending}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (!armed) {
          setArmed(true);
          return;
        }
        startTransition(async () => {
          const result = await deleteTransaction(id);
          setArmed(false);
          if (result.error || !result.snapshots) {
            notify.error(result.error ?? "Couldn't delete.");
            return;
          }
          const snapshots = result.snapshots;
          notify.undo("Transaction deleted", "Changed your mind?", async () => {
            const restored = await restoreTransactions(snapshots);
            if (restored.error) notify.error(restored.error);
            else notify.success(restored.message ?? "Restored");
          });
          router.push("/transactions");
        });
      }}
      className={cn(!armed && "text-danger")}
    >
      {pending ? <CircleNotch className="size-4 animate-spin" aria-hidden /> : <Trash className="size-4" aria-hidden />}
      {armed ? "Tap again to delete" : "Delete"}
    </Button>
  );
}
