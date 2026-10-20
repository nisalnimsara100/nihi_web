import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { requireOwnView } from "@/lib/auth";
import { todayDay } from "@/lib/dates";
import { param, type SearchParams } from "@/lib/search-params";
import { getTransactionFormOptions } from "../../transactions/form-data";
import { RecurringForm } from "../recurring-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "New repeat" };

export default async function NewRecurringPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getT();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("New repeat")} />
      <Suspense fallback={<Skeleton className="h-[640px]" />}>
        <NewRecurring searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewRecurring({ searchParams }: { searchParams: SearchParams }) {
  const { user } = await requireOwnView();
  const sp = await searchParams;
  const { accounts, categories } = await getTransactionFormOptions(user.id);
  const typeParam = param(sp, "type");
  const type = typeParam === "INCOME" || typeParam === "TRANSFER" ? typeParam : "EXPENSE";
  const accountParam = param(sp, "account");
  const amountParam = param(sp, "amount");
  const categoryParam = param(sp, "category");
  const toParam = param(sp, "to");

  return (
    <RecurringForm
      accounts={accounts}
      categories={categories}
      initial={{
        type,
        amount: amountParam && /^\d{1,9}(\.\d{1,2})?$/.test(amountParam) ? amountParam : "",
        accountId: accounts.some((a) => a.id === accountParam) ? accountParam! : (accounts[0]?.id ?? ""),
        toAccountId: accounts.some((a) => a.id === toParam) ? toParam! : "",
        categoryId: categories.some((c) => c.id === categoryParam && c.type === type) ? categoryParam! : "",
        note: (param(sp, "note") ?? "").slice(0, 200),
        frequency: "MONTHLY",
        nextDate: todayDay(),
        endDate: "",
      }}
    />
  );
}
