import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Repeat } from "@/components/icons";
import { DueRecurring, type DueItem } from "@/components/finance/due-recurring";
import { Amount, Card, CardHeader, EmptyState, IconLink, PageHeader, PageSkeleton } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getRecurring } from "@/lib/data";
import { dayToDate, dueLabel, formatDay, todayDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { dueCount, frequencyLabel, type Frequency } from "@/lib/recurring";
import { PauseButton } from "./pause-button";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Repeats" };

export default function RecurringPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Recurring />
    </Suspense>
  );
}

async function Recurring() {
  const t = await getT();
  const { owner: user, readOnly } = await getViewer();
  const rules = await getRecurring(user.id);
  const today = todayDay();
  const due = rules.filter((r) => r.active && r.nextDate <= today);

  const dueItems: DueItem[] = due.map((r) => ({
    id: r.id,
    title: r.note || r.category?.name || (r.type === "TRANSFER" ? "Transfer" : "Repeating transaction"),
    amount: formatMoney(r.amount, r.account.currency),
    when: dueLabel(r.nextDate, today),
    accountName: r.account.name,
    more: Math.max(0, dueCount(r.nextDate, r.frequency as Frequency, r.anchorDay, r.endDate, today) - 1),
  }));

  return (
    <>
      <PageHeader
        title={t("Repeats")}
        description="Rent, salary, subscriptions. You confirm each one when it is due."
        actions={
          readOnly ? undefined : (
            <IconLink href="/recurring/new" label="New repeat" tone="primary">
              <Plus className="size-5" aria-hidden />
            </IconLink>
          )
        }
      />

      {dueItems.length > 0 && !readOnly ? (
        <Card className="mb-4">
          <CardHeader title={t("Due now")} />
          <DueRecurring items={dueItems} />
        </Card>
      ) : null}

      {rules.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Repeat className="size-6" />}
            title={t("Nothing repeats yet")}
            description="Add the payments and income that come around every week, month or year."
            action={readOnly ? undefined : <Link href="/recurring/new" className="font-semibold text-primary hover:underline">{t("Add a repeat")}</Link>}
          />
        </Card>
      ) : (
        <Card className="px-4 sm:px-5">
          <ul className="divide-y divide-line">
            {rules.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3.5">
                <Link href={readOnly ? "#" : `/recurring/${r.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
                    <Repeat className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {r.note || r.category?.name || (r.type === "TRANSFER" ? "Transfer" : "Repeating transaction")}
                    </span>
                    <span className="block text-xs text-ink-soft">
                      {t(frequencyLabel(r.frequency))} · {r.active ? t("next {date}", { date: formatDay(dayToDate(r.nextDate)) }) : t("paused")} · {r.account.name}
                      {r.type === "TRANSFER" && r.toAccount ? ` → ${r.toAccount.name}` : ""}
                    </span>
                  </span>
                  <Amount minor={r.amount} currency={r.account.currency} kind={r.type} />
                </Link>
                {!readOnly ? <PauseButton id={r.id} active={r.active} /> : null}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
