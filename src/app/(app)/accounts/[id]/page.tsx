import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { requireOwnView } from "@/lib/auth";
import { getAccounts, getCards } from "@/lib/data";
import { toInputAmount } from "@/lib/money";
import { AccountForm } from "../account-form";
import { BalanceAdjust } from "../balance-adjust";
import { CardManager } from "../card-manager";

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
  const [accounts, cards] = await Promise.all([getAccounts(user.id, { includeArchived: true }), getCards(user.id, id)]);
  const account = accounts.find((a) => a.id === id);
  if (!account) {
    notFound();
  }
  return (
    <>
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
        creditLimit: account.creditLimit !== null ? toInputAmount(account.creditLimit) : "",
        interestRate: account.interestRate?.toString() ?? "",
        balanceOffset: account.balance - account.initialBalance,
        }}
      />
      <BalanceAdjust accountId={account.id} balance={account.balance} currency={account.currency} isCredit={account.type === "CREDIT_CARD"} />
      <CardManager accountId={account.id} cards={cards} />
    </>
  );
}
