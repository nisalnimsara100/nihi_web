/**
 * Heads-up messages for the home page: budgets nearly or fully used, payments coming up, credit
 * cards near their limit, and a month that is running well above the usual. Pure, so it can be tested.
 */
import { budgetLevel, WARN_AT } from "./budgets";

export type AlertTone = "bad" | "warn" | "info";
export type Alert = { id: string; tone: AlertTone; title: string; detail?: string; href: string };

export type AlertInput = {
  budgets: { id: string; name: string; spent: number; limit: number }[];
  /** Repeats that are not due yet but come up soon. `money` is already formatted. */
  upcoming: { id: string; title: string; daysAway: number; money: string }[];
  cards: { id: string; name: string; utilization: number }[];
  /** Spending so far this month, the average of the last three months, and how much of this month has passed (0 to 1). */
  spendNow: number;
  spendAverage: number;
  monthProgress: number;
  /** Formats minor units for a message. */
  money: (minor: number) => string;
};

const ORDER: Record<AlertTone, number> = { bad: 0, warn: 1, info: 2 };

export function buildAlerts(input: AlertInput, max = 5): Alert[] {
  const alerts: Alert[] = [];

  for (const b of input.budgets) {
    const level = budgetLevel(b.spent, b.limit);
    if (level === "over") {
      alerts.push({ id: `budget-${b.id}`, tone: "bad", title: `Over budget: ${b.name}`, detail: `${input.money(b.spent - b.limit)} over the ${input.money(b.limit)} limit`, href: "/budgets" });
    } else if (level === "warn") {
      alerts.push({ id: `budget-${b.id}`, tone: "warn", title: `${b.name} budget is ${Math.round((b.spent / b.limit) * 100)}% used`, detail: `${input.money(b.limit - b.spent)} left`, href: "/budgets" });
    }
  }

  for (const c of input.cards) {
    if (c.utilization >= 1) {
      alerts.push({ id: `card-${c.id}`, tone: "bad", title: `${c.name} is over its limit`, href: "/accounts" });
    } else if (c.utilization >= WARN_AT) {
      alerts.push({ id: `card-${c.id}`, tone: "warn", title: `${c.name} is ${Math.round(c.utilization * 100)}% of its limit`, href: "/accounts" });
    }
  }

  for (const u of input.upcoming) {
    alerts.push({
      id: `due-${u.id}`,
      tone: "info",
      title: `${u.title} ${u.daysAway === 0 ? "is due today" : u.daysAway === 1 ? "is due tomorrow" : `is due in ${u.daysAway} days`}`,
      detail: u.money,
      href: "/recurring",
    });
  }

  // Judge the pace only once a few days of the month have passed, or one big purchase looks like a trend.
  if (input.spendAverage > 0 && input.monthProgress >= 0.25 && input.spendNow > 0) {
    const projected = input.spendNow / input.monthProgress;
    if (projected > input.spendAverage * 1.3) {
      alerts.push({
        id: "pace",
        tone: "warn",
        title: `Spending is running ${Math.round((projected / input.spendAverage - 1) * 100)}% above your usual month`,
        detail: `${input.money(input.spendNow)} so far, against about ${input.money(input.spendAverage)} in a usual month`,
        href: "/statistics",
      });
    }
  }

  return alerts.sort((a, b) => ORDER[a.tone] - ORDER[b.tone]).slice(0, max);
}
