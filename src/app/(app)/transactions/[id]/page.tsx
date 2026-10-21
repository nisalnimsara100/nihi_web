import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { requireOwnView } from "@/lib/auth";
import { getTransaction, getTransactionImages } from "@/lib/data";
import { dateToDay } from "@/lib/dates";
import { toInputAmount } from "@/lib/money";
import { getTransactionFormOptions } from "../form-data";
import { SplitPanel } from "@/components/finance/split-panel";
import { TransactionForm } from "../transaction-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Edit transaction" };

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("Edit transaction")} />
      <Suspense fallback={<Skeleton className="h-[520px]" />}>
        <EditTransaction params={params} />
      </Suspense>
    </div>
  );
}

async function EditTransaction({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { user } = await requireOwnView();
  const { id } = await params;
  const tx = await getTransaction(user.id, id);
  if (!tx) {
    notFound();
  }

  const [options, images] = await Promise.all([
    getTransactionFormOptions(user.id, [tx.accountId, tx.toAccountId].filter((v): v is string => !!v)),
    getTransactionImages(user.id, tx.id),
  ]);

  const repeatParams = new URLSearchParams({ type: tx.type, amount: toInputAmount(tx.amount), account: tx.accountId, note: tx.note });
  if (tx.categoryId) repeatParams.set("category", tx.categoryId);
  if (tx.toAccountId) repeatParams.set("to", tx.toAccountId);

  return (
    <>
    <TransactionForm
      {...options}
      initial={{
        id: tx.id,
        type: tx.type,
        amount: toInputAmount(tx.amount),
        toAmount: tx.toAmount != null ? toInputAmount(tx.toAmount) : "",
        fee: tx.fee > 0 ? toInputAmount(tx.fee) : "",
        accountId: tx.accountId,
        toAccountId: tx.toAccountId ?? "",
        categoryId: tx.categoryId ?? "",
        cardId: tx.cardId ?? "",
        date: dateToDay(tx.date),
        note: tx.note,
        tagIds: tx.tags.map((t) => t.id),
        images,
      }}
    />
    <p className="mt-4 text-center text-sm">
      <Link href={`/recurring/new?${repeatParams}`} className="font-semibold text-primary hover:underline">
        {t("Make this repeat")}
      </Link>
    </p>
    {tx.type !== "TRANSFER" ? (
      <SplitPanel
        id={tx.id}
        total={tx.amount}
        currency={tx.account.currency}
        categories={options.categories.filter((c) => c.type === tx.type).map((c) => ({ id: c.id, name: c.name }))}
        note={tx.note}
        categoryId={tx.categoryId ?? ""}
      />
    ) : null}
    </>
  );
}
