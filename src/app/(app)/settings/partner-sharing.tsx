"use client";

import { useState, useSyncExternalStore } from "react";
import { invitePartner, leaveShare, removeShare, renewInvite, resendInvite, viewAs } from "@/actions/sharing";
import { DeleteButton, SubmitButton } from "@/components/form-bits";
import { notify } from "@/components/toast";
import { useActionForm } from "@/components/use-action-form";
import { Button, Card, CardHeader, Field, inputClass } from "@/components/ui";
import { useT } from "@/lib/i18n/client";

export type SentShare = { id: string; email: string; token: string; accepted: boolean; daysLeft: number };
export type ReceivedShare = { id: string; ownerId: string; ownerName: string };

/** Lets you invite a partner to view your finances read-only, and open accounts shared with you. */
export function PartnerSharing({
  sent,
  received,
  mailReady,
  ownerName,
}: {
  sent: SentShare[];
  received: ReceivedShare[];
  /** The server can send email itself (SMTP is configured). */
  mailReady: boolean;
  ownerName: string;
}) {
  const t = useT();
  const { state, pending, formRef, onSubmit } = useActionForm(invitePartner, { resetOnSuccess: true });
  const errors = state.fieldErrors ?? {};

  return (
    <Card>
      <CardHeader title={t("Partner access")} />
      <div className="space-y-6 p-4 sm:p-5">
        <section>
          <h3 className="text-sm font-semibold">{t("Let someone view your finances")}</h3>
          <p className="mt-1 text-sm text-ink-soft">
            {t("They can look at everything but change nothing. Create a link and send it to them on WhatsApp, SMS or anywhere. When they open it, they sign in or sign up and confirm, and they are connected.")}
          </p>
          <form ref={formRef} onSubmit={onSubmit} className="mt-3 space-y-3" noValidate>
            <Field label="Partner's email" htmlFor="partner-email" error={errors.email} hint="Only to remember who the link is for. They can use any email.">
              <input
                id="partner-email"
                name="email"
                type="email"
                autoComplete="off"
                placeholder={t("partner@example.com")}
                aria-invalid={!!errors.email}
                className={inputClass}
              />
            </Field>
            <SubmitButton pending={pending}>{mailReady ? "Create link and email it" : "Create invite link"}</SubmitButton>
          </form>

          {sent.length > 0 ? (
            <ul className="mt-4 divide-y divide-line rounded-2xl ring-1 ring-line">
              {sent.map((share) => (
                <li key={share.id} className="space-y-3 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{share.email}</span>
                      <span className="block text-xs text-ink-soft">
                        {share.accepted
                          ? t("Connected: can view")
                          : share.daysLeft <= 0
                            ? t("Expired: make a new link")
                            : share.daysLeft === 1
                              ? t("Waiting: works once, 1 day left")
                              : t("Waiting: works once, {days} days left", { days: share.daysLeft })}
                      </span>
                    </span>
                    <DeleteButton
                      size="sm"
                      label={share.accepted ? "Remove access" : "Cancel"}
                      confirmLabel="Tap again to confirm"
                      action={() => removeShare(share.id)}
                    />
                  </div>
                  {!share.accepted ? <InviteActions share={share} mailReady={mailReady} ownerName={ownerName} /> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {received.length > 0 ? (
          <section>
            <h3 className="text-sm font-semibold">{t("Shared with you")}</h3>
            <ul className="mt-3 divide-y divide-line rounded-2xl ring-1 ring-line">
              {received.map((share) => (
                <li key={share.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{share.ownerName}</span>
                  <form action={() => void viewAs(share.ownerId)}>
                    <Button type="submit" size="sm" variant="secondary">
                      {t("View")}
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

/** What to do with a pending invite link: copy it, send it on WhatsApp or the phone's share sheet, or email it. */
function InviteActions({ share, mailReady, ownerName }: { share: SentShare; mailReady: boolean; ownerName: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [sending, setSending] = useState(false);
  // The server renders "no share sheet"; the browser then reports whether it has one.
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

  const link = () => `${window.location.origin}/invite/${share.token}`;
  const message = () => `${ownerName} invited you to view their finances on NiHi. Open this link, sign in or sign up, and confirm to connect: ${link()}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notify.success("Invite link copied", "Paste it in a message to your partner.");
    } catch {
      notify.error("Couldn't copy the link", "Your browser blocked clipboard access.");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: "NiHi invite", text: message() });
    } catch {
      // The person closed the share sheet.
    }
  }

  async function renew() {
    setRenewing(true);
    const result = await renewInvite(share.id);
    setRenewing(false);
    if (result.error) notify.error(result.error);
    else notify.success(result.message ?? "New invite link ready", result.detail);
  }

  async function resend() {
    setSending(true);
    const result = await resendInvite(share.id);
    setSending(false);
    if (result.error) notify.error(result.error);
    else notify.success(result.message ?? "Invite sent again", result.detail);
  }

  if (share.daysLeft <= 0) {
    return (
      <Button type="button" size="sm" onClick={renew} disabled={renewing}>
        {renewing ? "Making a new link…" : "Make a new link"}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-soft" aria-label={t("Invite link")}>
          {`/invite/${share.token}`}
        </span>
        <Button type="button" size="sm" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message())}`, "_blank", "noopener")}>
          {t("WhatsApp")}
        </Button>
        {canShare ? (
          <Button type="button" size="sm" variant="secondary" onClick={nativeShare}>
            {t("Share")}
          </Button>
        ) : null}
        {mailReady ? (
          <Button type="button" size="sm" variant="secondary" onClick={resend} disabled={sending}>
            {sending ? "Sending…" : "Email it"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
