/** Budget status maths. Pure, so it can be tested. */

/** From this share of the limit on, a budget shows a warning. */
export const WARN_AT = 0.8;

export type BudgetLevel = "ok" | "warn" | "over";

export function budgetLevel(spent: number, limit: number): BudgetLevel {
  if (limit <= 0) return "ok";
  const ratio = spent / limit;
  return ratio >= 1 ? "over" : ratio >= WARN_AT ? "warn" : "ok";
}

export type BudgetStatus = {
  level: BudgetLevel;
  /** Share of the limit spent, 0 to 1 or more. */
  ratio: number;
  /** Limit minus spent. Negative when over. */
  left: number;
};

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  return { level: budgetLevel(spent, limit), ratio: limit > 0 ? spent / limit : 0, left: limit - spent };
}

/** The share of a month that has passed (0 to 1) for a "YYYY-MM-DD" day inside that month. */
export function monthProgress(today: string): number {
  const [y, m, d] = today.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Math.min(1, Math.max(0, d / days));
}
