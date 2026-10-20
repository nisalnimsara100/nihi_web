import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CaretRight, SignOut } from "@/components/icons";
import { logout } from "@/actions/auth";
import { MORE_ITEMS } from "@/components/shell/nav-items";
import { Avatar } from "@/components/shell/user-menu";
import { PageHeader, Skeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Profile" };

const tile = "flex w-full items-center gap-3 rounded-2xl bg-muted px-4 py-3.5 text-left transition-colors hover:bg-line/70";

export default async function MorePage() {
  const t = await getT();
  return (
    <div className="max-w-2xl">
      <PageHeader title={t("Profile")} />
      <Suspense fallback={<Skeleton className="mb-4 h-24" />}>
        <ProfileCard />
      </Suspense>
      <ul className="space-y-2">
        {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className={tile}>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-on-primary-soft">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="flex-1 font-semibold">{label}</span>
              <CaretRight className="size-5 text-ink-faint" aria-hidden />
            </Link>
          </li>
        ))}
        <li>
          <form action={logout}>
            <button type="submit" className={`${tile} text-danger`}>
              <span className="flex size-10 items-center justify-center rounded-2xl bg-danger-soft">
                <SignOut className="size-5" aria-hidden />
              </span>
              <span className="flex-1 font-semibold">{t("Sign out")}</span>
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}

async function ProfileCard() {
  const user = await getCurrentUser();
  return (
    <div className="bg-hero mb-4 flex items-center gap-4 rounded-3xl p-5 text-white shadow-lg shadow-primary/20">
      <Avatar name={user.name} className="size-14 bg-white/20 text-lg text-white ring-2 ring-white/30" />
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold">{user.name}</p>
        <p className="truncate text-sm text-white/75">{user.email}</p>
      </div>
    </div>
  );
}
