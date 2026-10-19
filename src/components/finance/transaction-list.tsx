import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import type { TransactionRow } from "@/lib/data";
import { dateToDay, formatDay, relativeDay } from "@/lib/dates";
import { Amount } from "@/components/ui";

function TransactionIcon({ tx }: { tx: TransactionRow }) {
  if (tx.type === "TRANSFER") {
    return (
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest text-lime">
        <ArrowLeftRight className="size-5" />
      </span>
    );
  }
  const name = tx.category?.name ?? "?";
  return (
    <span aria-hidden className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-forest text-base font-bold text-lime">
      {name[0]}
      <span
        className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full ring-2 ring-muted"
        style={{ background: tx.category?.color ?? "#8a8984" }}
      />
    </span>
  );
}

function TransactionItem({ tx, showDate }: { tx: TransactionRow; showDate: boolean }) {
  const isTransfer = tx.type === "TRANSFER";
  const title = isTransfer ? "Transfer" : (tx.category?.name ?? "Uncategorized");
  const where = isTransfer ? `${tx.account.name} → ${tx.toAccount?.name ?? "?"}` : tx.account.name;
  const meta = [showDate ? relativeDay(tx.date) : null, where, tx.note || null].filter(Boolean).join(" · ");

  return (
    <li>
      <Link
        href={`/transactions/${tx.id}`}
        className="flex items-center gap-3 rounded-2xl bg-muted px-3 py-3 transition-colors hover:bg-line/70 sm:px-4"
      >
        <TransactionIcon tx={tx} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{title}</span>
          <span className="block truncate text-xs text-ink-soft">{meta}</span>
          {tx.tags.length > 0 ? (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {tx.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                >
                  <span className="size-1.5 rounded-full" style={{ background: tag.color }} aria-hidden />
                  {tag.name}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 flex-col items-end">
          <Amount minor={tx.amount} currency={tx.account.currency} kind={tx.type} />
          {isTransfer && tx.toAccount && tx.toAccount.currency !== tx.account.currency && tx.toAmount ? (
            <Amount minor={tx.toAmount} currency={tx.toAccount.currency} kind="TRANSFER" className="text-xs font-medium" />
          ) : null}
        </span>
      </Link>
    </li>
  );
}

/** Transactions as rounded tiles, optionally grouped under a heading per day. */
export function TransactionList({ transactions, groupByDay = true }: { transactions: TransactionRow[]; groupByDay?: boolean }) {
  if (!groupByDay) {
    return (
      <ul className="space-y-2">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} tx={tx} showDate />
        ))}
      </ul>
    );
  }

  const groups = new Map<string, TransactionRow[]>();
  for (const tx of transactions) {
    const day = dateToDay(tx.date);
    groups.set(day, [...(groups.get(day) ?? []), tx]);
  }

  return (
    <div className="space-y-5">
      {[...groups].map(([day, items]) => (
        <section key={day}>
          <h3 className="mb-2 px-1 text-xs font-bold tracking-wide text-ink-soft uppercase">
            {relativeDay(items[0].date)}
            <span className="font-medium normal-case"> · {formatDay(items[0].date, "full")}</span>
          </h3>
          <ul className="space-y-2">
            {items.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} showDate={false} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
