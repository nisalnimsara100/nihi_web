/** Dates for repeating transactions. Pure, so it can be tested. All dates are "YYYY-MM-DD" calendar days. */
import { dateToDay, dayToDate } from "./dates";

export type Frequency = "WEEKLY" | "MONTHLY" | "YEARLY";

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "WEEKLY", label: "Every week" },
  { value: "MONTHLY", label: "Every month" },
  { value: "YEARLY", label: "Every year" },
];

export function frequencyLabel(frequency: string) {
  return FREQUENCIES.find((f) => f.value === frequency)?.label ?? frequency;
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The occurrence after `date`. Monthly and yearly rules aim for `anchorDay` of the month and use
 * the last day of a shorter month, so a rule that starts on the 31st goes 31, 28/29, 31, 30, ...
 */
export function nextOccurrence(date: string, frequency: Frequency, anchorDay: number): string {
  const [y, m] = date.split("-").map(Number);
  if (frequency === "WEEKLY") {
    const d = dayToDate(date);
    d.setUTCDate(d.getUTCDate() + 7);
    return dateToDay(d);
  }
  const [ny, nm] = frequency === "YEARLY" ? [y + 1, m] : m === 12 ? [y + 1, 1] : [y, m + 1];
  const day = Math.min(anchorDay, daysInMonth(ny, nm));
  return dateToDay(new Date(Date.UTC(ny, nm - 1, day, 12)));
}

/** Where a rule goes after its current occurrence is added or skipped: the next date, or null when it has ended. */
export function advance(date: string, frequency: Frequency, anchorDay: number, endDate: string | null): string | null {
  const next = nextOccurrence(date, frequency, anchorDay);
  return endDate && next > endDate ? null : next;
}

/** How many occurrences have been missed up to and including today, counting the one waiting. 0 when none is due. */
export function dueCount(nextDate: string, frequency: Frequency, anchorDay: number, endDate: string | null, today: string): number {
  let count = 0;
  let date: string | null = nextDate;
  while (date && date <= today && count < 366) {
    count++;
    date = advance(date, frequency, anchorDay, endDate);
  }
  return count;
}
