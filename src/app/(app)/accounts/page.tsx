import type { Metadata } from "next";
import { Suspense } from "react";
import { DragHandle, Plus, Wallet } from "@/components/icons";
import { ButtonLink, Card, EmptyState, IconLink, PageHeader, PageSkeleton } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { param, type SearchParams } from "@/lib/search-params";
import { accountTypeLabel } from "@/lib/constants";
import { getAccounts, getCards, type AccountWithBalance } from "@/lib/data";
import { creditFaceInfo, creditSummary } from "@/lib/credit-card";
import { formatMoney } from "@/lib/money";
import { AccountTile, WalletList, type WalletItem } from "./wallet-list";
import { getT } from "@/lib/i18n/server";
import type { TFunction } from "@/lib/i18n/translate";

export const metadata: Metadata = { title: "Wallet" };

export default function AccountsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Accounts searchParams={searchParams} />
    </Suspense>
  );
}

function toItem(
  account: AccountWithBalance,
  cards: { last4: string; network: string }[],
  t: TFunction,
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
      label: `${t(accountTypeLabel(account.type))}${account.archived ? ` · ${t("Archived")}` : ""}`,
      cards,
      credit:
        account.type === "CREDIT_CARD"
          ? creditFaceInfo(creditSummary(account.balance, account), account.currency)
          : undefined,
      dimmed: account.archived,
    },
  };
}

async function Accounts({ searchParams }: { searchParams: SearchParams }) {
  const t = await getT();
  const { owner: user, readOnly } = await getViewer();
  const sp = await searchParams;
  const [accounts, allCards] = await Promise.all([getAccounts(user.id, { includeArchived: true }), getCards(user.id)]);
  const cardsOf = (accountId: string) => allCards.filter((c) => c.accountId === accountId);
  const active = accounts.filter((a) => !a.archived);
  // Savings are money set aside: they get their own section and are not part of the total.
  const everyday = active.filter((a) => a.type !== "SAVINGS");
  const savings = active.filter((a) => a.type === "SAVINGS");
  const archived = accounts.filter((a) => a.archived);
  const canReorder = !readOnly && everyday.length > 1;
  const reordering = canReorder && param(sp, "reorder") === "1";

  const totals = new Map<string, number>();
  const cardsOwed = new Map<string, number>();
  const savingsTotals = new Map<string, number>();
  for (const a of savings) savingsTotals.set(a.currency, (savingsTotals.get(a.currency) ?? 0) + a.balance);
  for (const a of everyday) {
    // Credit cards are debt, so they are not part of the total. They are listed beside it.
    if (a.type !== "CREDIT_CARD") totals.set(a.currency, (totals.get(a.currency) ?? 0) + a.balance);
    else if (a.balance < 0) cardsOwed.set(a.currency, (cardsOwed.get(a.currency) ?? 0) - a.balance);
  }

  return (
    <>
      <PageHeader
        title={t("Wallet")}
        description={
          totals.size > 0 || cardsOwed.size > 0
            ? [
                totals.size > 0 ? `Total ${[...totals].map(([c, v]) => formatMoney(v, c)).join(" · ")}` : "",
                cardsOwed.size > 0 ? `Cards owe ${[...cardsOwed].map(([c, v]) => formatMoney(v, c)).join(" · ")}` : "",
              ]
                .filter(Boolean)
                .join(" · ")
            : "Where your money lives."
        }
        actions={
          readOnly ? undefined : (
            <div className="flex items-center gap-2">
              {canReorder ? (
                <IconLink
                  href={reordering ? "/accounts" : "/accounts?reorder=1"}
                  label={reordering ? "Stop reordering" : "Reorder accounts"}
                  tone={reordering ? "soft" : "outline"}
                >
                  <DragHandle className="size-5" aria-hidden />
                </IconLink>
              ) : null}
              <IconLink href="/accounts/new" label="New account" tone="primary">
                <Plus className="size-5" aria-hidden />
              </IconLink>
            </div>
          )
        }
      />

      {accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet className="size-6" />}
            title={t("No accounts yet")}
            description={readOnly ? "No accounts have been added yet." : "Add your wallet, bank account or card to start tracking."}
            action={readOnly ? undefined : <ButtonLink href="/accounts/new">{t("Add account")}</ButtonLink>}
          />
        </Card>
      ) : null}

      {everyday.length > 0 ? (
        <WalletList items={everyday.map((a) => toItem(a, cardsOf(a.id), t))} readOnly={readOnly} editing={reordering} />
      ) : null}

      {savings.length > 0 ? (
        <section className={everyday.length > 0 ? "mt-10" : ""}>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">{t("Savings")}</h2>
            <span className="text-sm font-semibold tabular-nums text-ink-soft">
              {[...savingsTotals].map(([c, v]) => formatMoney(v, c)).join(" · ")}
            </span>
          </div>
          <div className="mx-auto grid max-w-md gap-4 sm:mx-0 sm:max-w-none sm:grid-cols-2 lg:grid-cols-3">
            {savings.map((a, i) => (
              <AccountTile key={a.id} item={toItem(a, cardsOf(a.id), t)} index={i} stacked={false} readOnly={readOnly} />
            ))}
          </div>
        </section>
      ) : null}

      {archived.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-base font-semibold">{t("Archived")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((a, i) => (
              <AccountTile key={a.id} item={toItem(a, cardsOf(a.id), t)} index={i} stacked={false} readOnly={readOnly} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
