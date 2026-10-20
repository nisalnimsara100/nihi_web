"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { ActionState } from "@/actions/state";
import { notify } from "@/components/toast";

/**
 * Wraps a Server Action for a form without React's automatic form reset,
 * so typed values survive a validation error. Pass `resetOnSuccess` to
 * clear the form after an `{ ok: true }` result instead.
 */
export function useActionForm(
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>,
  { resetOnSuccess = false, onSuccess }: { resetOnSuccess?: boolean; onSuccess?: () => void } = {},
) {
  const [state, dispatch, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  // Results show as toasts. Field errors also stay next to their inputs.
  useEffect(() => {
    if (state.error) {
      const firstField = Object.values(state.fieldErrors ?? {}).flat()[0];
      notify.error(state.error, firstField);
    } else if (state.ok && state.message) {
      notify.success(state.message, state.detail);
    }
  }, [state]);

  useEffect(() => {
    if (!state.ok) return;
    if (resetOnSuccess) formRef.current?.reset();
    onSuccessRef.current?.();
  }, [state, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return { state, pending, formRef, onSubmit };
}
