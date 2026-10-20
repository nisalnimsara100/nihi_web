"use client";

import { useState } from "react";
import { invitePartner, leaveShare, removeShare, viewAs } from "@/actions/sharing";
import { DeleteButton, SubmitButton } from "@/components/form-bits";
import { notify } from "@/components/toast";
import { useActionForm } from "@/components/use-action-form";
import { Button, Card, CardHeader, Field, inputClass } from "@/components/ui";

export type SentShare = { id: string; email: string; token: string; accepted: boolean };
export type ReceivedShare = { id: string; ownerId: string; ownerName: string };

/** Lets you invite a partner to view your finances read-only, and open accounts shared with you. */
export function PartnerSharing({ sent, received }: { sent: SentShare[]; received: ReceivedShare[] }) {
  const { state, pending, formRef, onSubmit } = useActionForm(invitePartner, { resetOnSuccess: true });
  const errors = state.fieldErrors ?? {};

  return (
    <Card>
      <CardHeader title="Partner access" />
      <div className="space-y-6 p-4 sm:p-5">
        <section>
          <h3 className="text-sm font-semibold">Let someone view your finances</h3>
          <p className="mt-1 text-sm text-ink-soft">
            They can look at everything but change nothing. Send them the invite link, then they sign in with the
            invited email to accept it.
          </p>
          <form ref={formRef} onSubmit={onSubmit} className="mt-3 space-y-3" noValidate>
            <Field label="Partner's email" htmlFor="partner-email" error={errors.email}>
              <input
                id="partner-email"
                name="email"
                type="email"
                autoComplete="off"
                placeholder="partner@example.com"
                aria-invalid={!!errors.email}
                className={inputClass}
              />
            </Field>
            <SubmitButton pending={pending}>Create invite</SubmitButton>
          </form>

          {sent.length > 0 ? (
            <ul className="mt-4 divide-y divide-line rounded-2xl ring-1 ring-line">
              {sent.map((share) => (
                <li key={share.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{share.email}</span>
                    <span className="block text-xs text-ink-soft">
                      {share.accepted ? "Active: can view" : "Pending: waiting for them to accept"}
                    </span>
                  </span>
                  <CopyInviteLink token={share.token} />
                  <DeleteButton
                    size="sm"
                    label={share.accepted ? "Remove access" : "Cancel"}
                    confirmLabel="Tap again to confirm"
                    action={() => removeShare(share.id)}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {received.length > 0 ? (
          <section>
            <h3 className="text-sm font-semibold">Shared with you</h3>
            <ul className="mt-3 divide-y divide-line rounded-2xl ring-1 ring-line">
              {received.map((share) => (
                <li key={share.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{share.ownerName}</span>
                  <form action={() => void viewAs(share.ownerId)}>
                    <Button type="submit" size="sm" variant="secondary">
                      View
                    </Button>
                  </form>
                  <DeleteButton
                    size="sm"
                    label="Leave"
                    confirmLabel="Tap again to leave"
                    action={() => leaveShare(share.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Card>
  );
}

/** Copies the invite link. The origin comes from the browser so it works on any host. */
function CopyInviteLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify.success("Invite link copied", "Send it to your partner.");
    } catch {
      notify.error("Couldn't copy the link", "Your browser blocked clipboard access.");
    }
  }

  return (
    <Button type="button" size="sm" variant="ghost" onClick={copy}>
      {copied ? "Copied" : "Copy invite link"}
    </Button>
  );
}
