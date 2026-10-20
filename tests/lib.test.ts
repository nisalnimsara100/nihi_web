import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildAlerts } from "../src/lib/alerts";
import { budgetLevel, budgetStatus, monthProgress } from "../src/lib/budgets";
import { creditFaceInfo, creditSummary } from "../src/lib/credit-card";
import { addDays, daysBetween, dueLabel, shiftMonth } from "../src/lib/dates";
import { goalProgress, monthsUntil } from "../src/lib/goals";
import { interpolate, translate } from "../src/lib/i18n/translate";
import { si } from "../src/lib/i18n/si";
import { formatMoney, parseAmount, toInputAmount } from "../src/lib/money";
import { advance, dueCount, nextOccurrence } from "../src/lib/recurring";

describe("money", () => {
  it("parses typed amounts into minor units and rejects junk", () => {
    assert.equal(parseAmount("1,234.5"), 123450);
    assert.equal(parseAmount("0.56"), 56);
    assert.equal(parseAmount("  42 "), 4200);
    assert.equal(parseAmount("-350.00"), -35000);
    for (const bad of ["", "abc", "1.234", "1,2,3x", "--5"]) assert.equal(parseAmount(bad), null, bad);
  });

  it("never loses a cent to floating point", () => {
    assert.equal(parseAmount("0.29"), 29);
    assert.equal(parseAmount("1.15"), 115);
    assert.equal(parseAmount("19.99"), 1999);
    assert.equal(toInputAmount(parseAmount("1234.50")!), "1234.50");
  });

  it("formats rupees with Rs. and other currencies with their symbol", () => {
    assert.equal(formatMoney(125050, "LKR").replace(/ /g, " "), "Rs. 1,250.50");
    assert.match(formatMoney(4599, "USD"), /\$45\.99/);
    assert.match(formatMoney(-5000, "LKR", { signed: true }).replace(/ /g, " "), /-.*50\.00/);
  });
});

describe("dates", () => {
  it("moves days and months without time zone drift", () => {
    assert.equal(addDays("2026-10-31", 1), "2026-11-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
    assert.equal(shiftMonth("2026-01", -1), "2025-12");
    assert.equal(daysBetween("2026-10-19", "2026-10-25"), 6);
    assert.equal(dueLabel("2026-10-20", "2026-10-20"), "Due today");
    assert.equal(dueLabel("2026-10-19", "2026-10-20"), "Due yesterday");
    assert.equal(dueLabel("2026-10-15", "2026-10-20"), "Due 5 days ago");
  });
});

describe("repeating transactions", () => {
  it("keeps the day of the month, using the last day of short months", () => {
    assert.equal(nextOccurrence("2026-01-31", "MONTHLY", 31), "2026-02-28");
    assert.equal(nextOccurrence("2026-02-28", "MONTHLY", 31), "2026-03-31");
    assert.equal(nextOccurrence("2026-04-30", "MONTHLY", 31), "2026-05-31");
    assert.equal(nextOccurrence("2026-12-15", "MONTHLY", 15), "2027-01-15");
  });

  it("handles weekly and yearly rules, including 29 February", () => {
    assert.equal(nextOccurrence("2026-10-20", "WEEKLY", 20), "2026-10-27");
    assert.equal(nextOccurrence("2028-02-29", "YEARLY", 29), "2029-02-28");
    assert.equal(nextOccurrence("2029-02-28", "YEARLY", 29), "2030-02-28");
  });

  it("ends a rule after its last date", () => {
    assert.equal(advance("2026-10-25", "MONTHLY", 25, "2026-11-25"), "2026-11-25");
    assert.equal(advance("2026-11-25", "MONTHLY", 25, "2026-11-25"), null);
    assert.equal(advance("2026-10-25", "MONTHLY", 25, "2026-11-01"), null);
  });

  it("counts every occurrence that is waiting", () => {
    assert.equal(dueCount("2026-08-25", "MONTHLY", 25, null, "2026-10-26"), 3);
    assert.equal(dueCount("2026-10-27", "MONTHLY", 25, null, "2026-10-26"), 0);
    assert.equal(dueCount("2026-08-25", "MONTHLY", 25, "2026-09-25", "2026-10-26"), 2);
  });
});

describe("budgets", () => {
  it("warns from 80% and goes over at 100%", () => {
    assert.equal(budgetLevel(79999, 100000), "ok");
    assert.equal(budgetLevel(80000, 100000), "warn");
    assert.equal(budgetLevel(99999, 100000), "warn");
    assert.equal(budgetLevel(100000, 100000), "over");
    assert.equal(budgetLevel(5, 0), "ok");
    assert.deepEqual(budgetStatus(120000, 100000), { level: "over", ratio: 1.2, left: -20000 });
  });

  it("measures how much of the month has passed", () => {
    assert.equal(monthProgress("2026-10-31"), 1);
    assert.equal(monthProgress("2026-11-15"), 0.5);
  });
});

describe("credit cards", () => {
  const terms = { creditLimit: 20000000, interestRate: 3 };

  it("shows what is owed, what is left, and a month of interest", () => {
    const s = creditSummary(-5000000, terms);
    assert.equal(s.owed, 5000000);
    assert.equal(s.available, 15000000);
    assert.equal(s.utilization, 0.25);
    assert.equal(s.monthlyInterest, 150000);
  });

  it("reports an over-limit card and an overpaid one", () => {
    const over = creditSummary(-21000000, terms);
    assert.deepEqual([over.overLimit, over.available], [1000000, -1000000]);
    assert.equal(creditFaceInfo(over, "LKR").overLimit, true);
    const paid = creditSummary(300000, terms);
    assert.deepEqual([paid.owed, paid.available], [0, 20300000]);
  });

  it("copes with no terms set", () => {
    const bare = creditSummary(-100000, { creditLimit: null, interestRate: null });
    assert.deepEqual([bare.available, bare.utilization, bare.monthlyInterest], [null, null, null]);
  });
});

describe("savings goals", () => {
  it("counts a started month as a whole one, never less than one", () => {
    assert.equal(monthsUntil("2026-10-20", "2026-12-20"), 2);
    assert.equal(monthsUntil("2026-10-20", "2026-12-31"), 3);
    assert.equal(monthsUntil("2026-10-20", "2026-12-10"), 2);
    assert.equal(monthsUntil("2026-10-20", "2026-10-25"), 1);
  });

  it("works out progress and the monthly amount", () => {
    const p = goalProgress(2000000, 10000000, "2026-12-20", "2026-10-20");
    assert.equal(p.ratio, 0.2);
    assert.equal(p.remaining, 8000000);
    assert.equal(p.monthsLeft, 2);
    assert.equal(p.perMonth, 4000000);
    assert.equal(p.reached, false);
  });

  it("recognises a reached goal and an overdue one", () => {
    const done = goalProgress(12000000, 10000000, null, "2026-10-20");
    assert.deepEqual([done.reached, done.ratio, done.perMonth], [true, 1, null]);
    const late = goalProgress(1000, 10000, "2026-10-01", "2026-10-20");
    assert.deepEqual([late.overdue, late.perMonth], [true, null]);
  });
});

describe("heads-up alerts", () => {
  const base = { budgets: [], upcoming: [], cards: [], spendNow: 0, spendAverage: 0, monthProgress: 0.5, money: (n: number) => `Rs ${n / 100}` };

  it("puts over-budget before nearly-over, and both before reminders", () => {
    const alerts = buildAlerts({
      ...base,
      upcoming: [{ id: "r", title: "Rent", daysAway: 2, money: "Rs 25000" }],
      budgets: [{ id: "a", name: "Food", spent: 85, limit: 100 }, { id: "b", name: "Fuel", spent: 120, limit: 100 }, { id: "c", name: "Fun", spent: 10, limit: 100 }],
    });
    assert.deepEqual(alerts.map((a) => a.id), ["budget-b", "budget-a", "due-r"]);
    assert.deepEqual(alerts.map((a) => a.tone), ["bad", "warn", "info"]);
  });

  it("warns about a card near or over its limit, and a month running hot", () => {
    const alerts = buildAlerts({ ...base, cards: [{ id: "v", name: "Visa", utilization: 0.85 }, { id: "m", name: "Master", utilization: 1.1 }], spendNow: 80000, spendAverage: 100000, monthProgress: 0.5 });
    assert.deepEqual(alerts.map((a) => a.id), ["card-m", "card-v", "pace"]);
    assert.match(alerts[2].title, /60%/);
  });

  it("stays quiet when all is well, and does not judge the pace in the first days of a month", () => {
    assert.deepEqual(buildAlerts({ ...base, spendNow: 40000, spendAverage: 100000 }), []);
    assert.deepEqual(buildAlerts({ ...base, spendNow: 90000, spendAverage: 100000, monthProgress: 0.1 }), []);
  });

  it("words a payment due today, tomorrow or later", () => {
    const titles = buildAlerts({ ...base, upcoming: [0, 1, 3].map((d) => ({ id: `d${d}`, title: "Rent", daysAway: d, money: "" })) }).map((a) => a.title);
    assert.deepEqual(titles, ["Rent is due today", "Rent is due tomorrow", "Rent is due in 3 days"]);
  });
});

describe("translation", () => {
  it("falls back to English and fills placeholders", () => {
    assert.equal(translate(null, "{amount} left", { amount: "Rs 5" }), "Rs 5 left");
    assert.equal(translate({}, "Unknown text"), "Unknown text");
    assert.equal(interpolate("{a} and {b}", { a: 1 }), "1 and {b}");
  });

  it("every Sinhala entry keeps the same placeholders as its English key", () => {
    const names = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort().join(",");
    for (const [key, value] of Object.entries(si)) {
      assert.equal(names(value), names(key), `placeholders differ for "${key}"`);
      assert.ok(value.trim().length > 0, `empty translation for "${key}"`);
    }
  });
});

describe("error reports", () => {
  it("keeps what failed and where, and drops query strings and anything that could hold personal data", async () => {
    const { toErrorRecord } = await import("../src/lib/report-error");
    const record = toErrorRecord(
      Object.assign(new Error("column Card.network does not exist"), { digest: "abc123" }),
      { path: "/accounts/x?token=secret&email=a@b.c", method: "GET" },
      { routePath: "/accounts/[id]", routeType: "render" },
      new Date("2026-10-20T10:00:00Z"),
    );
    assert.deepEqual(record, { time: "2026-10-20T10:00:00.000Z", message: "column Card.network does not exist", digest: "abc123", path: "/accounts/x", method: "GET", route: "/accounts/[id]", kind: "render" });
    assert.ok(!JSON.stringify(record).includes("secret"));
  });

  it("copes with errors that are not Error objects", async () => {
    const { toErrorRecord } = await import("../src/lib/report-error");
    assert.equal(toErrorRecord("plain text", { path: "/", method: "POST" }, { routePath: "/", routeType: "action" }).message, "plain text");
    assert.equal(toErrorRecord(null, { path: "/", method: "POST" }, { routePath: "/", routeType: "action" }).message, "null");
  });
});
