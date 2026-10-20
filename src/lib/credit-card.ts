/**
 * Credit card maths. A credit card account's balance is what the user owes, as a negative
 * number: spending lowers it, and paying the card (a transfer in) raises it back towards zero.
 *
 * Everything here is an estimate from the terms the user typed in. The bank's statement is
 * the final word on what is due.
 */
import { dateToDay, dayToDate } from "./dates";
import { formatMoney } from "./money";

export type CreditTerms = {
  creditLimit: number | null;
  statementDay: number | null;
  dueDay: number | null;
  interestRate: number | null;
  annualFee: number | null;
  lateFee: number | null;
  minPaymentPercent: number;
  minPaymentFloor: number;
};

export type CreditSummary = {
  /** Amount owed to the bank, never negative. */
  owed: number;
  /** Limit minus what is owed, or null when no limit is set. Negative when over the limit. */
  available: number | null;
  /** Share of the limit in use, 0 to 1 (can exceed 1), or null without a limit. */
  utilization: number | null;
  /** How far past the limit the balance is, 0 when within it. */
  overLimit: number;
  nextStatement: string | null;
  nextDue: string | null;
  daysToDue: number | null;
  /** Estimated minimum payment: the percentage of what is owed, at least the floor, at most all of it. */
  minimumDue: number;
  /** Interest for one month if the balance is carried over, or null without a rate. */
  monthlyInterest: number | null;
};

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** The next date (today included) that falls on `day` of a month, using the last day in short months. */
export function nextDayOfMonth(day: number, today: string): string {
  const [y, m, d] = today.split("-").map(Number);
  const thisMonth = Math.min(day, daysInMonth(y, m));
  if (thisMonth >= d) return dateToDay(new Date(Date.UTC(y, m - 1, thisMonth, 12)));
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  return dateToDay(new Date(Date.UTC(nextY, nextM - 1, Math.min(day, daysInMonth(nextY, nextM)), 12)));
}

export function daysBetween(from: string, to: string) {
  return Math.round((dayToDate(to).getTime() - dayToDate(from).getTime()) / 86_400_000);
}

export function creditSummary(balance: number, terms: CreditTerms, today: string): CreditSummary {
  const owed = Math.max(0, -balance);
  const limit = terms.creditLimit;
  // Paying more than is owed leaves a positive balance, which adds to the room left.
  const available = limit === null ? null : limit + balance;
  const nextDue = terms.dueDay ? nextDayOfMonth(terms.dueDay, today) : null;
  const minimumDue =
    owed === 0 ? 0 : Math.min(owed, Math.max(terms.minPaymentFloor, Math.ceil((owed * terms.minPaymentPercent) / 100)));
  return {
    owed,
    available,
    utilization: limit ? owed / limit : null,
    overLimit: limit === null ? 0 : Math.max(0, owed - limit),
    nextStatement: terms.statementDay ? nextDayOfMonth(terms.statementDay, today) : null,
    nextDue,
    daysToDue: nextDue ? daysBetween(today, nextDue) : null,
    minimumDue,
    monthlyInterest: terms.interestRate === null ? null : Math.round((owed * terms.interestRate) / 100 / 12),
  };
}

export type CreditFaceInfo = {
  /** "Rs. 150,000.00 available" or "Over limit by Rs. 10,000.00", or null without a limit. */
  available: string | null;
  /** 0 to 1, how much of the limit is used. */
  utilization: number | null;
  overLimit: boolean;
  /** "Due 25 Oct", with `soon` set when it is within five days. */
  due: { label: string; soon: boolean } | null;
};

const DUE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function formatDueDay(day: string) {
  return DUE_FORMAT.format(dayToDate(day));
}

/** What the wallet card shows for a credit card, ready to print. Nothing is shown while nothing is owed and no terms are set. */
export function creditFaceInfo(summary: CreditSummary, currency: string): CreditFaceInfo {
  return {
    available:
      summary.available === null
        ? null
        : summary.overLimit > 0
          ? `Over limit by ${formatMoney(summary.overLimit, currency)}`
          : `${formatMoney(summary.available, currency)} available`,
    utilization: summary.utilization,
    overLimit: summary.overLimit > 0,
    // A due date is only worth showing while something is owed.
    due: summary.nextDue && summary.owed > 0 ? { label: `Due ${formatDueDay(summary.nextDue)}`, soon: (summary.daysToDue ?? 99) <= 5 } : null,
  };
}
