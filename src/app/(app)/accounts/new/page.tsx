import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { COLORS } from "@/lib/constants";
import { AccountForm } from "../account-form";

export const metadata: Metadata = { title: "New account" };

export default function NewAccountPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New account" />
      <Suspense fallback={<Skeleton className="h-[560px]" />}>
        <NewAccount />
      </Suspense>
    </div>
  );
}

async function NewAccount() {
  const user = await getCurrentUser();
  return (
    <AccountForm
      initial={{
        name: "",
        type: "BANK",
        currency: user.defaultCurrency,
        initialBalance: "",
        color: COLORS[0],
        note: "",
        archived: false,
      }}
    />
  );
}
