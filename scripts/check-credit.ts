/** Checks the credit card maths. Run: npx tsx scripts/check-credit.ts */
import { creditSummary, nextDayOfMonth, type CreditTerms } from "../src/lib/credit-card";

const terms: CreditTerms = { creditLimit: 20000000, statementDay: 5, dueDay: 25, interestRate: 24, annualFee: 500000, lateFee: 175000, minPaymentPercent: 5, minPaymentFloor: 50000 };
let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `: ${JSON.stringify(got)} != ${JSON.stringify(want)}`}`);
}

eq("due later this month", nextDayOfMonth(25, "2026-10-20"), "2026-10-25");
eq("due today counts", nextDayOfMonth(20, "2026-10-20"), "2026-10-20");
eq("due already passed", nextDayOfMonth(5, "2026-10-20"), "2026-11-05");
eq("rolls into next year", nextDayOfMonth(5, "2026-12-20"), "2027-01-05");
eq("31st in a 30-day month", nextDayOfMonth(31, "2026-11-10"), "2026-11-30");
eq("31st rolling into February", nextDayOfMonth(31, "2027-01-31"), "2027-01-31");
eq("30th after Jan 31 lands in Feb", nextDayOfMonth(30, "2027-01-31"), "2027-02-28");

const s = creditSummary(-5000000, terms, "2026-10-20");
eq("owed", s.owed, 5000000);
eq("available", s.available, 15000000);
eq("utilization", s.utilization, 0.25);
eq("minimum due is 5%", s.minimumDue, 250000);
eq("monthly interest at 24%", s.monthlyInterest, 100000);
eq("days to due", s.daysToDue, 5);
eq("next statement", s.nextStatement, "2026-11-05");

eq("minimum floor applies", creditSummary(-200000, terms, "2026-10-20").minimumDue, 50000);
eq("floor never above what is owed", creditSummary(-30000, terms, "2026-10-20").minimumDue, 30000);
eq("nothing owed", creditSummary(0, terms, "2026-10-20").minimumDue, 0);
const over = creditSummary(-21000000, terms, "2026-10-20");
eq("over limit", [over.overLimit, over.available], [1000000, -1000000]);
const paidExtra = creditSummary(300000, terms, "2026-10-20");
eq("overpaid card has more room", [paidExtra.owed, paidExtra.available], [0, 20300000]);
const bare = creditSummary(-100000, { ...terms, creditLimit: null, dueDay: null, statementDay: null, interestRate: null }, "2026-10-20");
eq("no terms set", [bare.available, bare.utilization, bare.nextDue, bare.monthlyInterest], [null, null, null, null]);

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
