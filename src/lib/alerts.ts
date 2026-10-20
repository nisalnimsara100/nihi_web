/**
 * Heads-up messages for the home page: budgets nearly or fully used, payments coming up, credit
 * cards near their limit, and a month that is running well above the usual. Pure, so it can be tested.
 */
import { budgetLevel, WARN_AT } from "./budgets";
import { interpolate, type TFunction } from "./i18n/translate";

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
  /** Translator for the messages; English text is used when it is left out. */
  t?: TFunction;
};

const ORDER: Record<AlertTone, number> = { bad: 0, warn: 1, info: 2 };

export function buildAlerts(input: AlertInput, max = 5): Alert[] {
  const alerts: Alert[] = [];
  const t: TFunction = input.t ?? ((text, vars) => interpolate(text, vars));

  for (const b of input.budgets) {
    const level = budgetLevel(b.spent, b.limit);
    if (level === "over") {
      alerts.push({ id: `budget-${b.id}`, tone: "bad", title: t("Over budget: {name}", { name: b.name }), detail: t("{over} over the {limit} limit", { over: input.money(b.spent - b.limit), limit: input.money(b.limit) }), href: "/budgets" });
    } else if (level === "warn") {
      alerts.push({ id: `budget-${b.id}`, tone: "warn", title: t("{name} budget is {percent}% used", { name: b.name, percent: Math.round((b.spent / b.limit) * 100) }), detail: t("{amount} left", { amount: input.money(b.limit - b.spent) }), href: "/budgets" });
    }
  }

  for (const c of input.cards) {
    if (c.utilization >= 1) {
      alerts.push({ id: `card-${c.id}`, tone: "bad", title: t("{name} is over its limit", { name: c.name }), href: "/accounts" });
    } else if (c.utilization >= WARN_AT) {
      alerts.push({ id: `card-${c.id}`, tone: "warn", title: t("{name} is {percent}% of its limit", { name: c.name, percent: Math.round(c.utilization * 100) }), href: "/accounts" });
    }
  }

  for (const u of input.upcoming) {
    alerts.push({
      id: `due-${u.id}`,
      tone: "info",
      title: u.daysAway === 0 ? t("{title} is due today", { title: u.title }) : u.daysAway === 1 ? t("{title} is due tomorrow", { title: u.title }) : t("{title} is due in {days} days", { title: u.title, days: u.daysAway }),
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
        title: t("Spending is running {percent}% above your usual month", { percent: Math.round((projected / input.spendAverage - 1) * 100) }),
        detail: t("{spent} so far, against about {usual} in a usual month", { spent: input.money(input.spendNow), usual: input.money(input.spendAverage) }),
        href: "/statistics",
      });
    }
  }

  return alerts.sort((a, b) => ORDER[a.tone] - ORDER[b.tone]).slice(0, max);
}
