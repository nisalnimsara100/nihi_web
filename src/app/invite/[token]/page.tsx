import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/actions/auth";
import { acceptInvite } from "@/actions/sharing";
import { Logo } from "@/components/logo";
import { AcceptInviteDialog } from "./accept-invite-dialog";
import { Button, ButtonLink, Card, Skeleton } from "@/components/ui";
import { db, run } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Partner invite" };

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm">
        <Suspense fallback={<Skeleton className="h-64" />}>
          <Invite params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await run(
    db()
      .from("PartnerShare")
      .select("email, partnerId, owner:User!PartnerShare_ownerId_fkey(name)")
      .eq("token", token)
      .maybeSingle(),
  );

  if (!share) {
    return (
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Invite not valid</h1>
        <p className="mt-2 text-sm text-ink-soft">
          This invite was cancelled or replaced. Ask your partner to send a new link.
        </p>
        <ButtonLink href="/" variant="soft" className="mt-6 w-full">
          Go to NiHi
        </ButtonLink>
      </Card>
    );
  }

  const ownerName = share.owner?.name ?? "Someone";
  const userId = await getSessionUserId();
  const me = userId
    ? await run(db().from("User").select("email").eq("id", userId).maybeSingle())
    : null;
  const next = encodeURIComponent(`/invite/${token}`);
  // Sign-in and sign-up come back here with the invited email already filled in.
  const emailParam = encodeURIComponent(share.email);

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{ownerName} invited you</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {ownerName} wants to share their NiHi finances with you. You can look at everything, but you can&apos;t change
        anything. The invite is for <span className="font-semibold text-ink">{share.email}</span>.
      </p>

      {!me ? (
        <div className="mt-6 space-y-3">
          <ButtonLink href={`/login?next=${next}&email=${emailParam}`} className="w-full">
            Log in to accept
          </ButtonLink>
          <ButtonLink href={`/signup?next=${next}&email=${emailParam}`} variant="soft" className="w-full">
            Create an account
          </ButtonLink>
          <p className="text-center text-xs text-ink-soft">Use the email {share.email}.</p>
        </div>
      ) : share.partnerId && share.partnerId !== userId ? (
        <p className="mt-6 rounded-2xl bg-warning-soft p-3 text-sm text-warning">
          This invite has already been used. Ask {ownerName} for a new one.
        </p>
      ) : me.email === share.email ? (
        <AcceptButton token={token} ownerName={ownerName} />
      ) : (
        <div className="mt-6 space-y-3">
          <p className="rounded-2xl bg-warning-soft p-3 text-sm text-warning">
            You&apos;re signed in as {me.email}. Sign in with {share.email} to accept.
          </p>
          <form action={logout}>
            <Button type="submit" variant="secondary" className="w-full">
              Sign out
            </Button>
          </form>
          <Link href="/dashboard" className="block text-center text-sm font-medium text-primary hover:underline">
            Back to my dashboard
          </Link>
        </div>
      )}
    </Card>
  );
}

function AcceptButton({ token, ownerName }: { token: string; ownerName: string }) {
  async function accept() {
    "use server";
    await acceptInvite(token);
  }
  return <AcceptInviteDialog ownerName={ownerName} accept={accept} />;
}
