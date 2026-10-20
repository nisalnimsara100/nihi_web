import type { Metadata } from "next";
import { Suspense } from "react";
import { SignOut } from "@/components/icons";
import { logout } from "@/actions/auth";
import { Button, Card, CardHeader, PageHeader, Skeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
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
