import type { Metadata } from "next";
import { Suspense } from "react";
import { Wallet } from "@/components/icons";
import { ButtonLink, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { requireOwnView } from "@/lib/auth";
import { todayDay } from "@/lib/dates";
import { param, type SearchParams } from "@/lib/search-params";
import { getTransactionFormOptions } from "../form-data";
import { TransactionForm } from "../transaction-form";

export const metadata: Metadata = { title: "New transaction" };

export default function NewTransactionPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New transaction" />
      <Suspense fallback={<Skeleton className="h-[520px]" />}>
        <NewTransaction searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewTransaction({ searchParams }: { searchParams: SearchParams }) {
  const { user } = await requireOwnView();
  const sp = await searchParams;
  const { accounts, categories, tags, history, cards } = await getTransactionFormOptions(user.id);

  if (accounts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Wallet className="size-6" />}
          title="Add an account first"
          description="Transactions belong to an account, like your wallet or a bank account."
          action={<ButtonLink href="/accounts/new">Add account</ButtonLink>}
        />
      </Card>
    );
  }

  const typeParam = param(sp, "type");
  const type = typeParam === "INCOME" || typeParam === "TRANSFER" ? typeParam : "EXPENSE";
  const accountParam = param(sp, "account");
  const accountId = accounts.some((a) => a.id === accountParam) ? accountParam! : accounts[0].id;

  return (
    <TransactionForm
      accounts={accounts}
      categories={categories}
      tags={tags}
      history={history}
      cards={cards}
      initial={{
        type,
        amount: "",
        toAmount: "",
        accountId,
        toAccountId: accounts.find((a) => a.id !== accountId)?.id ?? "",
        categoryId: type === "TRANSFER" ? "" : (categories.find((c) => c.type === type)?.id ?? ""),
        date: todayDay(),
        cardId: "",
        note: "",
        tagIds: [],
      }}
    />
  );
}
