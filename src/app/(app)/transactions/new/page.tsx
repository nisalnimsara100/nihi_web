import type { Metadata } from "next";
import { Suspense } from "react";
import { Wallet } from "@/components/icons";
import { ButtonLink, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { requireOwnView } from "@/lib/auth";
import { todayDay } from "@/lib/dates";
import { param, type SearchParams } from "@/lib/search-params";
import { getTransactionFormOptions } from "../form-data";
import { TransactionForm } from "../transaction-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "New transaction" };

export default async function NewTransactionPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getT();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("New transaction")} />
      <Suspense fallback={<Skeleton className="h-[520px]" />}>
        <NewTransaction searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewTransaction({ searchParams }: { searchParams: SearchParams }) {
  const t = await getT();
  const { user } = await requireOwnView();
  const sp = await searchParams;
  const { accounts, categories, tags, history, cards, imagesEnabled } = await getTransactionFormOptions(user.id);

  if (accounts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Wallet className="size-6" />}
          title={t("Add an account first")}
          description="Transactions belong to an account, like your wallet or a bank account."
          action={<ButtonLink href="/accounts/new">{t("Add account")}</ButtonLink>}
        />
      </Card>
    );
  }

  const typeParam = param(sp, "type");
  const type = typeParam === "INCOME" || typeParam === "TRANSFER" ? typeParam : "EXPENSE";
  const accountParam = param(sp, "account");
  // Shortcuts from the credit card page: pay a card (`to`), or record a fee with an amount and note.
  const toParam = param(sp, "to");
  const toId = type === "TRANSFER" && accounts.some((a) => a.id === toParam) ? toParam! : "";
  const amountParam = param(sp, "amount");
  const amount = amountParam && /^\d{1,9}(\.\d{1,2})?$/.test(amountParam) ? amountParam : "";
  const noteParam = (param(sp, "note") ?? "").slice(0, 200);
  // A card payment comes from another account than the card itself.
  const fromChoices = accounts.filter((a) => a.id !== toId);
  const accountId = fromChoices.some((a) => a.id === accountParam) ? accountParam! : (fromChoices[0]?.id ?? accounts[0].id);
  // Fees and interest are not groceries: pick a category named like a fee, or leave it empty.
  const feeCategory = noteParam ? categories.find((c) => c.type === type && /fee|charge|interest|bank/i.test(c.name)) : undefined;

  return (
    <TransactionForm
      accounts={accounts}
      categories={categories}
      tags={tags}
      history={history}
      cards={cards}
      imagesEnabled={imagesEnabled}
      autoScan={param(sp, "scan") === "1"}
      initial={{
        type,
        amount,
        toAmount: "",
        fee: "",
        accountId,
        toAccountId: toId || (accounts.find((a) => a.id !== accountId)?.id ?? ""),
        categoryId:
          type === "TRANSFER" ? "" : noteParam ? (feeCategory?.id ?? "") : (categories.find((c) => c.type === type)?.id ?? ""),
        date: todayDay(),
        cardId: "",
        note: noteParam,
        tagIds: [],
      }}
    />
  );
}
