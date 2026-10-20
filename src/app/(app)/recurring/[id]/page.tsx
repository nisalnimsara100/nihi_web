import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { requireOwnView } from "@/lib/auth";
import { getRecurringById } from "@/lib/data";
import { toInputAmount } from "@/lib/money";
import { getTransactionFormOptions } from "../../transactions/form-data";
import { RecurringForm } from "../recurring-form";

export const metadata: Metadata = { title: "Edit repeat" };

export default function EditRecurringPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit repeat" />
      <Suspense fallback={<Skeleton className="h-[640px]" />}>
        <EditRecurring params={params} />
      </Suspense>
    </div>
  );
}

async function EditRecurring({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireOwnView();
  const { id } = await params;
  const rule = await getRecurringById(user.id, id);
  if (!rule) notFound();
  const { accounts, categories } = await getTransactionFormOptions(user.id, [rule.accountId, rule.toAccountId].filter((v): v is string => !!v));

  return (
    <RecurringForm
      accounts={accounts}
      categories={categories}
      initial={{
        id: rule.id,
        type: rule.type,
        amount: toInputAmount(rule.amount),
        accountId: rule.accountId,
        toAccountId: rule.toAccountId ?? "",
        categoryId: rule.categoryId ?? "",
        note: rule.note,
        frequency: rule.frequency,
        nextDate: rule.nextDate,
        endDate: rule.endDate ?? "",
      }}
    />
  );
}
