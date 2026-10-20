import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { requireOwnView } from "@/lib/auth";
import { getTransaction } from "@/lib/data";
import { dateToDay } from "@/lib/dates";
import { toInputAmount } from "@/lib/money";
import { getTransactionFormOptions } from "../form-data";
import { TransactionForm } from "../transaction-form";

export const metadata: Metadata = { title: "Edit transaction" };

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit transaction" />
      <Suspense fallback={<Skeleton className="h-[520px]" />}>
        <EditTransaction params={params} />
      </Suspense>
    </div>
  );
}

async function EditTransaction({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireOwnView();
  const { id } = await params;
  const tx = await getTransaction(user.id, id);
  if (!tx) {
    notFound();
  }

  const options = await getTransactionFormOptions(
    user.id,
    [tx.accountId, tx.toAccountId].filter((v): v is string => !!v),
  );

  return (
    <TransactionForm
      {...options}
      initial={{
        id: tx.id,
        type: tx.type,
        amount: toInputAmount(tx.amount),
        toAmount: tx.toAmount != null ? toInputAmount(tx.toAmount) : "",
        accountId: tx.accountId,
        toAccountId: tx.toAccountId ?? "",
        categoryId: tx.categoryId ?? "",
        cardId: tx.cardId ?? "",
        date: dateToDay(tx.date),
        note: tx.note,
        tagIds: tx.tags.map((t) => t.id),
      }}
    />
  );
}
