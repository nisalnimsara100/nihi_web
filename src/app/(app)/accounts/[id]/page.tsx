import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { requireOwnView } from "@/lib/auth";
import { getAccounts } from "@/lib/data";
import { toInputAmount } from "@/lib/money";
import { AccountForm } from "../account-form";

export const metadata: Metadata = { title: "Edit account" };

export default function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit account" />
      <Suspense fallback={<Skeleton className="h-[620px]" />}>
        <EditAccount params={params} />
      </Suspense>
    </div>
  );
}

async function EditAccount({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireOwnView();
  const { id } = await params;
  const account = (await getAccounts(user.id, { includeArchived: true })).find((a) => a.id === id);
  if (!account) {
    notFound();
  }
  return (
    <AccountForm
      initial={{
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        initialBalance: toInputAmount(account.initialBalance),
        color: account.color,
        theme: account.theme,
        note: account.note,
        archived: account.archived,
        balanceOffset: account.balance - account.initialBalance,
      }}
    />
  );
}
