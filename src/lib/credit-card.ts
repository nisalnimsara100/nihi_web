/**
 * Credit card maths, kept simple. A credit card account's balance is what the user owes, as a
 * negative number: spending lowers it and paying the card (a transfer in) raises it again.
 * The user only sets a credit limit and a monthly interest rate.
 */
import { formatMoney } from "./money";

export type CreditTerms = {
  /** Most the bank lets the user owe, in minor units. */
  creditLimit: number | null;
  /** Interest per month, in percent, on what is owed. */
  interestRate: number | null;
};

export type CreditSummary = {
  /** Amount owed, never negative. */
  owed: number;
  /** The remaining balance: limit minus what is owed. Negative when over the limit. Null without a limit. */
  available: number | null;
  /** Share of the limit in use, 0 to 1 (can pass 1), or null without a limit. */
  utilization: number | null;
  overLimit: number;
  /** About one month of interest on what is owed now, or null without a rate. */
  monthlyInterest: number | null;
};

export function creditSummary(balance: number, terms: CreditTerms): CreditSummary {
  const owed = Math.max(0, -balance);
  const limit = terms.creditLimit;
  return {
    owed,
    // Paying more than is owed leaves a positive balance, which adds to the room left.
    available: limit === null ? null : limit + balance,
    utilization: limit ? owed / limit : null,
    overLimit: limit === null ? 0 : Math.max(0, owed - limit),
    monthlyInterest: terms.interestRate === null ? null : Math.round((owed * terms.interestRate) / 100),
  };
}

export type CreditFaceInfo = {
  /** "Rs. 150,000.00 left" or "Over limit by Rs. 10,000.00", or null without a limit. */
  available: string | null;
  /** 0 to 1, how much of the limit is used. */
  utilization: number | null;
  overLimit: boolean;
};

/** What the wallet card shows for a credit card, ready to print. */
export function creditFaceInfo(summary: CreditSummary, currency: string): CreditFaceInfo {
  return {
    available:
      summary.available === null
        ? null
        : summary.overLimit > 0
          ? `Over limit by ${formatMoney(summary.overLimit, currency)}`
          : `${formatMoney(summary.available, currency)} left`,
    utilization: summary.utilization,
    overLimit: summary.overLimit > 0,
  };
}
