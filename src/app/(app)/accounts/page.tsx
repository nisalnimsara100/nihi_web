import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus, Wallet } from "@/components/icons";
import { ButtonLink, Card, EmptyState, IconLink, PageHeader, PageSkeleton } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { accountTypeLabel } from "@/lib/constants";
import { getAccounts, getCards, type AccountWithBalance } from "@/lib/data";
import { creditFaceInfo, creditSummary } from "@/lib/credit-card";
import { todayDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { AccountTile, WalletList, type WalletItem } from "./wallet-list";

export const metadata: Metadata = { title: "Wallet" };

export default function AccountsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Accounts />
    </Suspense>
  );
}

function toItem(
  account: AccountWithBalance,
  cards: { last4: string; network: string }[],
): WalletItem {
  return {
    id: account.id,
    face: {
      theme: account.theme,
      type: account.type,
      name: account.name,
      balance: formatMoney(account.balance, account.currency),
      currency: account.currency,
      color: account.color,
      label: `${accountTypeLabel(account.type)}${account.archived ? " · Archived" : ""}`,
      cards,
      credit:
        account.type === "CREDIT_CARD"
          ? creditFaceInfo(creditSummary(account.balance, account, todayDay()), account.currency)
          : undefined,
      dimmed: account.archived,
    },
  };
}

async function Accounts() {
  const { owner: user, readOnly } = await getViewer();
  const [accounts, allCards] = await Promise.all([getAccounts(user.id, { includeArchived: true }), getCards(user.id)]);
  const cardsOf = (accountId: string) => allCards.filter((c) => c.accountId === accountId);
  const active = accounts.filter((a) => !a.archived);
  const archived = accounts.filter((a) => a.archived);

  const totals = new Map<string, number>();
  for (const a of active) totals.set(a.currency, (totals.get(a.currency) ?? 0) + a.balance);

  return (
    <>
      <PageHeader
        title="Wallet"
        description={
          totals.size > 0 ? `Total ${[...totals].map(([c, v]) => formatMoney(v, c)).join(" · ")}` : "Where your money lives."
        }
        actions={
          readOnly ? undefined : (
            <IconLink href="/accounts/new" label="New account" tone="primary">
              <Plus className="size-5" aria-hidden />
            </IconLink>
          )
        }
      />

      {accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet className="size-6" />}
            title="No accounts yet"
            description={readOnly ? "No accounts have been added yet." : "Add your wallet, bank account or card to start tracking."}
            action={readOnly ? undefined : <ButtonLink href="/accounts/new">Add account</ButtonLink>}
          />
        </Card>
      ) : null}

      {active.length > 0 ? (
        <WalletList items={active.map((a) => toItem(a, cardsOf(a.id)))} readOnly={readOnly} />
      ) : null}

      {archived.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-base font-semibold">Archived</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((a, i) => (
              <AccountTile key={a.id} item={toItem(a, cardsOf(a.id))} index={i} stacked={false} readOnly={readOnly} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
