/**
 * Transactions store calendar days at 12:00 UTC, so every date helper here
 * works in UTC and never shifts a day across time zones.
 */

export type MonthKey = string; // "YYYY-MM"

export function dayToDate(day: string) {
  return new Date(`${day}T12:00:00.000Z`);
}

export function dateToDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function todayDay() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function currentMonthKey(): MonthKey {
  return todayDay().slice(0, 7);
}

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthRange(key: MonthKey) {
  const [y, m] = key.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

export function yearRange(year: number) {
  return { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) };
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function monthKeyOf(date: Date): MonthKey {
  return date.toISOString().slice(0, 7);
}

export function formatMonth(key: MonthKey, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat("en-US", {
    month: style,
    year: "numeric",
    timeZone: "UTC",
  }).format(monthRange(key).start);
}

export function formatMonthShort(key: MonthKey) {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
    monthRange(key).start,
  );
}

export function formatDay(date: Date, style: "full" | "short" = "short") {
  return new Intl.DateTimeFormat("en-US", {
    weekday: style === "full" ? "long" : undefined,
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "Today", "Yesterday", or a short date like "Oct 12". */
export function relativeDay(date: Date) {
  const day = dateToDay(date);
  const today = todayDay();
  if (day === today) return "Today";
  if (day === dateToDay(new Date(dayToDate(today).getTime() - 86_400_000))) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

/** Whole days from one "YYYY-MM-DD" day to another (negative when `to` is earlier). */
export function daysBetween(from: string, to: string) {
  return Math.round((dayToDate(to).getTime() - dayToDate(from).getTime()) / 86_400_000);
}

/** "Due today", "Due yesterday", "Due 3 days ago" for a day that is today or earlier. */
export function dueLabel(day: string, today: string) {
  const late = daysBetween(day, today);
  return late <= 0 ? "Due today" : late === 1 ? "Due yesterday" : `Due ${late} days ago`;
}
