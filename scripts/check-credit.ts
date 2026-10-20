/** Checks the credit card maths. Run: npx tsx scripts/check-credit.ts */
import { creditSummary } from "../src/lib/credit-card";

const terms = { creditLimit: 20000000, interestRate: 3 };
let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `: ${JSON.stringify(got)} != ${JSON.stringify(want)}`}`);
}

const s = creditSummary(-5000000, terms);
eq("owed", s.owed, 5000000);
eq("remaining balance", s.available, 15000000);
eq("utilization", s.utilization, 0.25);
eq("one month of interest at 3%", s.monthlyInterest, 150000);

const over = creditSummary(-21000000, terms);
eq("over limit", [over.overLimit, over.available], [1000000, -1000000]);
eq("overpaid card has more room", [creditSummary(300000, terms).owed, creditSummary(300000, terms).available], [0, 20300000]);
eq("nothing owed, no interest", creditSummary(0, terms).monthlyInterest, 0);
const bare = creditSummary(-100000, { creditLimit: null, interestRate: null });
eq("no terms set", [bare.available, bare.utilization, bare.monthlyInterest], [null, null, null]);

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
