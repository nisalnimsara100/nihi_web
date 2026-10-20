import { Card, ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { creditSummary, formatDueDay, type CreditTerms } from "@/lib/credit-card";
import { todayDay } from "@/lib/dates";
import { formatMoney, toInputAmount } from "@/lib/money";

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warn" | "bad" }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
      <p className={cn("truncate text-base font-bold tabular-nums", tone === "warn" && "text-ink", tone === "bad" && "text-danger")}>{value}</p>
      {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

/** The state of a credit card account: what is owed, room left, when to pay, and shortcuts to pay or record a fee. */
export function CreditPanel({
  accountId,
  balance,
  currency,
  terms,
}: {
  accountId: string;
  balance: number;
  currency: string;
  terms: CreditTerms;
}) {
  const s = creditSummary(balance, terms, todayDay());
  const money = (n: number) => formatMoney(n, currency);
  const newTx = (params: Record<string, string>) => `/transactions/new?${new URLSearchParams(params)}`;
  const pct = s.utilization === null ? null : Math.round(s.utilization * 100);
  const soon = s.daysToDue !== null && s.daysToDue <= 5 && s.owed > 0;

  return (
    <Card className="mb-4 p-4 sm:p-6">
      <h2 className="text-base font-bold text-ink">Credit card overview</h2>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="You owe" value={money(s.owed)} />
        <Stat label="Available credit" value={s.available === null ? "Set a limit" : money(s.available)} tone={s.overLimit > 0 ? "bad" : undefined} />
        <Stat label="Credit limit" value={terms.creditLimit === null ? "Not set" : money(terms.creditLimit)} />
      </div>

      {pct !== null ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pct}% of the limit used`}>
            <div
              className={cn("h-full rounded-full", s.overLimit > 0 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-primary")}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {pct}% of your limit is used.
            {pct >= 30 ? " Staying under about 30% is easier on your credit." : ""}
          </p>
          {s.overLimit > 0 ? (
            <p className="mt-1 text-sm font-semibold text-danger">
              You are {money(s.overLimit)} over your limit. Banks usually charge an over-limit fee, so pay it down soon.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
        <Stat label="Payment due" value={s.nextDue ? formatDueDay(s.nextDue) : "Not set"} hint={s.nextDue && s.owed > 0 ? (s.daysToDue === 0 ? "Due today" : `In ${s.daysToDue} days`) : undefined} tone={soon ? "warn" : undefined} />
        <Stat label="Next statement" value={s.nextStatement ? formatDueDay(s.nextStatement) : "Not set"} />
        <Stat label="Minimum payment" value={s.owed > 0 ? money(s.minimumDue) : "None due"} hint="Estimate" />
        {s.monthlyInterest !== null && s.owed > 0 ? (
          <Stat label="Interest if carried" value={money(s.monthlyInterest)} hint={`Per month at ${terms.interestRate}% a year, if not paid in full`} />
        ) : null}
        {terms.annualFee ? <Stat label="Annual fee" value={money(terms.annualFee)} /> : null}
        {terms.lateFee ? <Stat label="Late payment fee" value={money(terms.lateFee)} /> : null}
      </div>

      <p className="mt-4 text-xs text-ink-soft">
        These are estimates from the terms you entered, worked out on your balance today. Interest is normally charged from the purchase
        date when a statement is not paid in full, and cash advances are charged from day one. Your statement is the final word.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {s.owed > 0 ? (
          <>
            <ButtonLink href={newTx({ type: "TRANSFER", to: accountId, amount: toInputAmount(s.minimumDue), note: "Credit card payment" })} size="sm">
              Pay minimum
            </ButtonLink>
            <ButtonLink href={newTx({ type: "TRANSFER", to: accountId, amount: toInputAmount(s.owed), note: "Credit card payment" })} size="sm" variant="soft">
              Pay in full
            </ButtonLink>
          </>
        ) : null}
        {terms.annualFee ? (
          <ButtonLink href={newTx({ type: "EXPENSE", account: accountId, amount: toInputAmount(terms.annualFee), note: "Annual fee" })} size="sm" variant="secondary">
            Record annual fee
          </ButtonLink>
        ) : null}
        {terms.lateFee ? (
          <ButtonLink href={newTx({ type: "EXPENSE", account: accountId, amount: toInputAmount(terms.lateFee), note: "Late payment fee" })} size="sm" variant="secondary">
            Record late fee
          </ButtonLink>
        ) : null}
        <ButtonLink href={newTx({ type: "EXPENSE", account: accountId, note: "Interest charge" })} size="sm" variant="secondary">
          Record interest
        </ButtonLink>
      </div>
    </Card>
  );
}
