/** Savings goal maths. Pure, so it can be tested. */
export type GoalProgress = {
  saved: number;
  target: number;
  remaining: number;
  /** 0 to 1 (capped at 1). */
  ratio: number;
  reached: boolean;
  /** Whole months from today to the target date, at least 1, or null with no date (or a past one). */
  monthsLeft: number | null;
  /** What to put aside each month to arrive on time, or null with no future date or when reached. */
  perMonth: number | null;
  /** The target date has passed and the goal is not reached. */
  overdue: boolean;
};

/** Months from today to a later day, counting a part of a month as a whole one, and at least 1. */
export function monthsUntil(today: string, target: string): number {
  const [ty, tm, td] = today.split("-").map(Number);
  const [gy, gm, gd] = target.split("-").map(Number);
  // Oct 20 to Dec 20 is 2; to Dec 31 is 3 (11 extra days); to Dec 10 is 2 (a month and 20 days).
  return Math.max(1, (gy - ty) * 12 + (gm - tm) + (gd > td ? 1 : 0));
}

export function goalProgress(saved: number, target: number, targetDate: string | null, today: string): GoalProgress {
  const remaining = Math.max(0, target - saved);
  const reached = saved >= target;
  const future = targetDate !== null && targetDate > today;
  const monthsLeft = future ? monthsUntil(today, targetDate!) : null;
  return {
    saved,
    target,
    remaining,
    ratio: target > 0 ? Math.min(1, saved / target) : 0,
    reached,
    monthsLeft,
    perMonth: !reached && monthsLeft ? Math.ceil(remaining / monthsLeft) : null,
    overdue: !reached && targetDate !== null && targetDate <= today,
  };
}
