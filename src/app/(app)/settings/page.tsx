import type { Metadata } from "next";
import { Suspense } from "react";
import { SignOut } from "@/components/icons";
import { logout } from "@/actions/auth";
import { Button, Card, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { db, run } from "@/lib/db";
import { mailConfigured } from "@/lib/mail";
import { PartnerSharing } from "./partner-sharing";
import { PasswordForm, ProfileForm } from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <Profile />
        </Suspense>
        <PasswordForm />
        <Suspense fallback={<Skeleton className="h-64" />}>
          <Partners />
        </Suspense>
        <Card>
          <CardHeader title="Session" />
          <form action={logout} className="p-4 sm:p-5">
            <Button type="submit" variant="secondary">
              <SignOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

async function Profile() {
  const user = await getCurrentUser();
  return <ProfileForm name={user.name} email={user.email} defaultCurrency={user.defaultCurrency} />;
}

async function Partners() {
  const user = await getCurrentUser();
  const [sent, received] = await Promise.all([
    run(
      db()
        .from("PartnerShare")
        .select("id, email, token, acceptedAt")
        .eq("ownerId", user.id)
        .order("createdAt", { ascending: false }),
    ),
    run(
      db()
        .from("PartnerShare")
        .select("id, ownerId, owner:User!PartnerShare_ownerId_fkey(name)")
        .eq("partnerId", user.id)
        .not("acceptedAt", "is", null)
        .order("acceptedAt", { ascending: false }),
    ),
  ]);
  return (
    <PartnerSharing
      mailReady={mailConfigured()}
      ownerName={user.name}
      sent={sent.map((s) => ({ id: s.id, email: s.email, token: s.token, accepted: s.acceptedAt !== null }))}
      received={received.map((s) => ({ id: s.id, ownerId: s.ownerId, ownerName: s.owner?.name ?? "Unknown" }))}
    />
  );
}
