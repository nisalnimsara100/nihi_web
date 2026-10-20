import { ArrowsLeftRight, CreditCard } from "@/components/icons";
import { cardLabel } from "@/lib/card-networks";
import { getT } from "@/lib/i18n/server";
import type { TFunction } from "@/lib/i18n/translate";
import type { TransactionRow } from "@/lib/data";
import { dateToDay, formatDay, relativeDay } from "@/lib/dates";
import { Amount, MaybeLink } from "@/components/ui";
import { CategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/cn";

const iconTile =
  "relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface text-ink shadow-[0_1px_3px_rgb(20_21_28/0.08)] ring-1 ring-line/60";

function TransactionIcon({ tx }: { tx: TransactionRow }) {
  if (tx.type === "TRANSFER") {
    return (
      <span aria-hidden className={iconTile}>
        <ArrowsLeftRight className="size-5" />
      </span>
    );
  }
  return (
    <span aria-hidden className={iconTile}>
      <CategoryIcon name={tx.category?.icon} className="size-5" />
      <span
        className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface"
        style={{ background: tx.category?.color ?? "#8a8984" }}
      />
    </span>
  );
}

function TransactionItem({ tx, showDate, readOnly, selectable, t }: { tx: TransactionRow; showDate: boolean; readOnly: boolean; selectable: boolean; t: TFunction }) {
  const isTransfer = tx.type === "TRANSFER";
  const title = isTransfer ? t("Transfer") : (tx.category?.name ?? t("Uncategorized"));
  const where = isTransfer ? `${tx.account.name} → ${tx.toAccount?.name ?? "?"}` : tx.account.name;
  // Left line: the date in flat lists, otherwise the note or account. Right line: account or "Transfer".
  const left = showDate ? t(relativeDay(tx.date)) : tx.note || where;
  const right = isTransfer ? t("Transfer") : showDate || tx.note ? tx.account.name : "";

  const content = (
    <>
      <TransactionIcon tx={tx} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block truncate text-sm text-ink-soft">{left}</span>
        {tx.tags.length > 0 || tx.card ? (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {tx.card ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-on-primary-soft tabular-nums">
                <CreditCard className="size-3" aria-hidden />
                {cardLabel(tx.card.network, tx.card.last4)}
              </span>
            ) : null}
            {tx.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-soft ring-1 ring-line/60"
              >
                <span className="size-1.5 rounded-full" style={{ background: tag.color }} aria-hidden />
                {tag.name}
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <span className="flex max-w-[45%] shrink-0 flex-col items-end">
        <Amount minor={tx.amount} currency={tx.account.currency} kind={tx.type} />
        {isTransfer && tx.toAccount && tx.toAccount.currency !== tx.account.currency && tx.toAmount ? (
          <Amount minor={tx.toAmount} currency={tx.toAccount.currency} kind="TRANSFER" className="text-xs font-medium" />
        ) : (
          <span className="max-w-full truncate text-sm text-ink-soft">{right || "\u00a0"}</span>
        )}
      </span>
    </>
  );

  if (selectable) {
    return (
      <li>
        <label className="-mx-2 flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 transition-colors has-[:checked]:bg-primary-soft/70">
          <input type="checkbox" name="ids" value={tx.id} className="size-5 shrink-0 accent-primary" aria-label={t("Select {name}", { name: title })} />
          {content}
        </label>
      </li>
    );
  }

  return (
    <li>
      <MaybeLink
        href={readOnly ? undefined : `/transactions/${tx.id}`}
        className={cn("-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2", !readOnly && "transition-colors hover:bg-surface/70")}
      >
        {content}
      </MaybeLink>
    </li>
  );
}

/** Transactions as rounded tiles, optionally grouped under a heading per day. */
export async function TransactionList({
  transactions,
  groupByDay = true,
  readOnly = false,
  selectable = false,
}: {
  transactions: TransactionRow[];
  groupByDay?: boolean;
  /** Rows are not links to the edit page. */
  readOnly?: boolean;
  /** Rows become checkboxes named "ids" (for bulk actions) instead of links. */
  selectable?: boolean;
}) {
  const t = await getT();
  if (!groupByDay) {
    return (
      <ul className="space-y-1">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} tx={tx} showDate readOnly={readOnly} selectable={selectable} t={t} />
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
          <h3 className="mb-1 text-sm font-semibold text-ink-soft">
            {t(relativeDay(items[0].date))}
            <span className="font-normal"> · {formatDay(items[0].date, "full")}</span>
          </h3>
          <ul className="space-y-1">
            {items.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} showDate={false} readOnly={readOnly} selectable={selectable} t={t} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
