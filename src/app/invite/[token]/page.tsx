import type { Metadata } from "next";
import { Suspense } from "react";
import { acceptInvite } from "@/actions/sharing";
import { Logo } from "@/components/logo";
import { AcceptInviteDialog } from "./accept-invite-dialog";
import { ButtonLink, Card, Skeleton } from "@/components/ui";
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
  const signedIn = !!userId;
  const next = encodeURIComponent(`/invite/${token}`);

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{ownerName} invited you</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {ownerName} wants to share their NiHi finances with you. You can look at everything, but you can&apos;t change
        anything.
      </p>

      {!signedIn ? (
        <div className="mt-6 space-y-3">
          <ButtonLink href={`/login?next=${next}`} className="w-full">
            Log in to accept
          </ButtonLink>
          <ButtonLink href={`/signup?next=${next}`} variant="soft" className="w-full">
            Create an account
          </ButtonLink>
          <p className="text-center text-xs text-ink-soft">Use any email you like. You will confirm on the next screen.</p>
        </div>
      ) : share.partnerId && share.partnerId !== userId ? (
        <p className="mt-6 rounded-2xl bg-warning-soft p-3 text-sm text-warning">
          This invite has already been used. Ask {ownerName} for a new one.
        </p>
      ) : (
        <AcceptButton token={token} ownerName={ownerName} />
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
