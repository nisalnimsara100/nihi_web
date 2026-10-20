/** Checks the screenshot parser against typical OCR output. Run: npx tsx scripts/check-scan.ts */
import { parseScan } from "../src/lib/scan/parse";

const TODAY = "2026-10-20";
type Case = { name: string; text: string; amount: number | null; type: string; day: string; merchant?: RegExp; last4?: string };

const cases: Case[] = [
  { name: "ComBank SMS", text: "Commercial Bank: Your Card ending 4521 was used for LKR 1,250.00 purchase at KEELLS SUPER on 18/10/2026. Avl Bal LKR 45,300.50", amount: 125000, type: "EXPENSE", day: "2026-10-18", merchant: /KEELLS/i, last4: "4521" },
  { name: "Sampath debit", text: "Sampath Bank: Rs. 3,400.00 debited from A/C xx7788 on 05-10-26 at CEYPETCO FUEL. Balance Rs. 12,000.00", amount: 340000, type: "EXPENSE", day: "2026-10-05", merchant: /CEYPETCO/i, last4: "7788" },
  { name: "Salary credit", text: "BOC: Your A/C ending 3321 has been credited with LKR 150,000.00 Salary on 2026-10-25. Available balance LKR 162,450.75", amount: 15000000, type: "INCOME", day: "2026-10-25", last4: "3321" },
  { name: "Balance first", text: "Available balance Rs. 99,000.00\nYou paid Rs. 560.00 to PICKME on 20 Oct 2026", amount: 56000, type: "EXPENSE", day: "2026-10-20", merchant: /PICKME/i },
  { name: "HNB POS", text: "HNB: POS purchase of LKR 8,990.00 at ARPICO SUPERCENTRE card **1234 on 12/10/2026 14:32. Limit LKR 200,000.00", amount: 899000, type: "EXPENSE", day: "2026-10-12", merchant: /ARPICO/i, last4: "1234" },
  { name: "Email alert", text: "Dear Customer,\nA transaction of USD 45.99 was made at NETFLIX.COM on Oct 3, 2026 using your credit card ending 9988.\nAvailable limit USD 2,000.00", amount: 4599, type: "EXPENSE", day: "2026-10-03", merchant: /NETFLIX/i, last4: "9988" },
  { name: "Transfer", text: "Fund transfer of Rs. 25,000.00 to A/C 1234 successful on 02/10/2026. Fee Rs. 25.00", amount: 2500000, type: "TRANSFER", day: "2026-10-02" },
  { name: "Receipt", text: "KEELLS SUPERMARKET\nColombo 03\nDate: 14/10/2026 18:22\nMilk 450.00\nBread 120.00\nSubtotal 570.00\nTOTAL Rs. 570.00\nThank you", amount: 57000, type: "EXPENSE", day: "2026-10-14", merchant: /KEELLS/i },
  { name: "Receipt grand total", text: "Green Cafe\n12 Galle Rd\nItems 3\nSub Total 1,800.00\nService charge 180.00\nGrand Total 1,980.00\n20-10-2026", amount: 198000, type: "EXPENSE", day: "2026-10-20", merchant: /Green Cafe/i },
  { name: "Received", text: "You have received Rs. 7,500.00 from NIMAL PERERA on 09 Oct 2026. Ref 889123", amount: 750000, type: "INCOME", day: "2026-10-09" },
  { name: "Refund", text: "Refund of LKR 2,100.00 for order has been credited to your card ending 1111 on 11/10/2026", amount: 210000, type: "INCOME", day: "2026-10-11", last4: "1111" },
  { name: "Withdrawal", text: "ATM withdrawal of Rs 10,000.00 from card xx2222 on 08/10/2026. Bal Rs 20,000.00", amount: 1000000, type: "EXPENSE", day: "2026-10-08", last4: "2222" },
  { name: "Rs without dot", text: "Payment of Rs 1500 to DIALOG AXIATA successful 16/10/2026", amount: 150000, type: "EXPENSE", day: "2026-10-16", merchant: /DIALOG/i },
  { name: "Dollar sign", text: "You spent $12.50 at STARBUCKS on 2026-10-01", amount: 1250, type: "EXPENSE", day: "2026-10-01", merchant: /STARBUCKS/i },
  { name: "Only balance", text: "Your available balance is Rs. 5,000.00", amount: null, type: "EXPENSE", day: TODAY },
  { name: "No money", text: "Hello there, hope you are well", amount: null, type: "EXPENSE", day: TODAY },
  { name: "Dark mode UPI", text: "Paid to Ravi Stores\nLKR 640.00\n20 Oct 2026, 09:15", amount: 64000, type: "EXPENSE", day: "2026-10-20", merchant: /Ravi/i },
  { name: "Fee ignored", text: "Debited Rs. 5,000.00 on 03/10/2026. Transaction fee Rs. 50.00. Balance Rs. 1,000.00", amount: 500000, type: "EXPENSE", day: "2026-10-03" },
];

let failed = 0;
for (const c of cases) {
  const r = parseScan(c.text, TODAY);
  const problems: string[] = [];
  if (r.amount.minor !== c.amount) problems.push(`amount ${r.amount.minor} != ${c.amount}`);
  if (r.type.value !== c.type) problems.push(`type ${r.type.value} != ${c.type}`);
  if (r.date.day !== c.day) problems.push(`day ${r.date.day} != ${c.day}`);
  if (c.merchant && !c.merchant.test(r.merchant.text)) problems.push(`merchant "${r.merchant.text}"`);
  if (c.last4 && r.account.last4 !== c.last4) problems.push(`last4 ${r.account.last4} != ${c.last4}`);
  if (problems.length) failed++;
  console.log(`${problems.length ? "FAIL" : "ok  "} ${c.name}${problems.length ? ": " + problems.join("; ") : ""}`);
}
console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
