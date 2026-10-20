import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Wallet } from "@/components/icons";
import { ButtonLink, Card, ColorDot, EmptyState, IconLink, PageHeader, PageSkeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { accountTypeLabel } from "@/lib/constants";
import { getAccounts, type AccountWithBalance } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Wallet" };

export default function AccountsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Accounts />
    </Suspense>
  );
}

// Card faces cycle through blue, lavender and ink, like a stack of payment cards.
const FACES = [
  { card: "bg-hero text-white", soft: "text-white/75", mark: "text-white/10" },
  { card: "bg-primary-soft text-on-primary-soft", soft: "text-on-primary-soft/75", mark: "text-on-primary-soft/10" },
  { card: "bg-[#1d1f2e] text-white", soft: "text-white/65", mark: "text-white/[0.06]" },
];

function AccountCard({ account, index, stacked }: { account: AccountWithBalance; index: number; stacked: boolean }) {
  const face = FACES[index % FACES.length];
  return (
    <Link
      href={`/accounts/${account.id}`}
      className={cn(
        "group relative block transition-transform hover:-translate-y-1",
        // On phones the cards overlap so each one shows its top strip, like a wallet.
        stacked && index > 0 && "-mt-28 sm:mt-0",
      )}
      style={{ zIndex: index }}
    >
      <div
        className={cn(
          "relative flex aspect-[1.7/1] flex-col justify-between overflow-hidden rounded-3xl p-5 shadow-[0_-6px_24px_rgb(20_21_28/0.14)] sm:shadow-lg sm:shadow-primary/10",
          face.card,
          account.archived && "opacity-60",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-4 -bottom-8 text-[7rem] leading-none font-black tracking-tighter uppercase italic select-none",
            face.mark,
          )}
        >
          NiHi
        </span>
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <p className={cn("truncate text-sm font-semibold", face.soft)}>{account.name}</p>
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
              <ColorDot color={account.color} />
              {account.currency}
            </span>
          </div>
          <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl">
            {formatMoney(account.balance, account.currency)}
          </p>
        </div>
        <p className={cn("relative text-xs font-semibold", face.soft)}>
          {accountTypeLabel(account.type)}
          {account.archived ? " · Archived" : ""}
        </p>
      </div>
    </Link>
  );
}

async function Accounts() {
  const user = await getCurrentUser();
  const accounts = await getAccounts(user.id, { includeArchived: true });
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
          <IconLink href="/accounts/new" label="New account" tone="primary">
            <Plus className="size-5" aria-hidden />
          </IconLink>
        }
      />

      {accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet className="size-6" />}
            title="No accounts yet"
            description="Add your wallet, bank account or card to start tracking."
            action={<ButtonLink href="/accounts/new">Add account</ButtonLink>}
          />
        </Card>
      ) : null}

      {active.length > 0 ? (
        <div className="mx-auto max-w-md sm:mx-0 sm:grid sm:max-w-none sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {active.map((a, i) => (
            <AccountCard key={a.id} account={a} index={i} stacked />
          ))}
        </div>
      ) : null}

      {archived.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-base font-semibold">Archived</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archived.map((a, i) => (
              <AccountCard key={a.id} account={a} index={i} stacked={false} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
