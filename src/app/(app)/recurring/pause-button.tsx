"use client";

import { useTransition } from "react";
import { setRecurringActive } from "@/actions/recurring";
import { notify } from "@/components/toast";
import { Button } from "@/components/ui";

export function PauseButton({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setRecurringActive(id, !active);
          if (result.error) notify.error(result.error);
          else notify.success(result.message ?? "Saved");
        })
      }
    >
      {active ? "Pause" : "Resume"}
    </Button>
  );
}
