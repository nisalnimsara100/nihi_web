import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseScan } from "../src/lib/scan/parse";
import { suggestCategory } from "../src/lib/scan/categorize";

const TODAY = "2026-10-20"; // a Tuesday
type Case = { name: string; text: string; amount: number | null; type: string; day: string; merchant?: RegExp; last4?: string; hint?: string; high?: boolean };

const cases: Case[] = [
  { name: "ComBank SMS", text: "Commercial Bank: Your Card ending 4521 was used for LKR 1,250.00 purchase at KEELLS SUPER on 18/10/2026. Avl Bal LKR 45,300.50", amount: 125000, type: "EXPENSE", day: "2026-10-18", merchant: /KEELLS/i, last4: "4521" },
  { name: "Sampath debit", text: "Sampath Bank: Rs. 3,400.00 debited from A/C xx7788 on 05-10-26 at CEYPETCO FUEL. Balance Rs. 12,000.00", amount: 340000, type: "EXPENSE", day: "2026-10-05", merchant: /CEYPETCO/i, last4: "7788" },
  { name: "Salary credit", text: "BOC: Your A/C ending 3321 has been credited with LKR 150,000.00 Salary on 2026-10-15. Available balance LKR 162,450.75", amount: 15000000, type: "INCOME", day: "2026-10-15", last4: "3321" },
  { name: "Balance first", text: "Available balance Rs. 99,000.00\nYou paid Rs. 560.00 to PICKME on 20 Oct 2026", amount: 56000, type: "EXPENSE", day: "2026-10-20", merchant: /PICKME/i },
  { name: "HNB POS", text: "HNB: POS purchase of LKR 8,990.00 at ARPICO SUPERCENTRE card **1234 on 12/10/2026 14:32. Limit LKR 200,000.00", amount: 899000, type: "EXPENSE", day: "2026-10-12", merchant: /ARPICO/i, last4: "1234" },
  { name: "Email alert", text: "Dear Customer,\nA transaction of USD 45.99 was made at NETFLIX.COM on Oct 3, 2026 using your credit card ending 9988.\nAvailable limit USD 2,000.00", amount: 4599, type: "EXPENSE", day: "2026-10-03", merchant: /NETFLIX/i, last4: "9988" },
  { name: "Plain transfer", text: "Fund transfer of Rs. 25,000.00 to A/C 1234 successful on 02/10/2026. Fee Rs. 25.00", amount: 2500000, type: "TRANSFER", day: "2026-10-02" },
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
  // Real OCR output from the user's own screenshots and photos.
  { name: "BOC CEFT (real)", text: "Saturday 13:00\nCEFT Transfer Debit Rs\n7025.00 From A/C No\nXXXXXXXXXX570. Balance\navailable Rs 3158.74 - Thank\nyou for banking with BOC", amount: 702500, type: "EXPENSE", day: "2026-10-17", merchant: /CEFT/i, last4: "570" },
  { name: "BOC POS/ATM (real)", text: "Yesterday 16:39\nPOS/ATM Transaction Rs\n171.26 From A/C No\nXXXXXXXXXX570. Balance\navailable Rs 962.48 - Thank\nyou for banking with BOC", amount: 17126, type: "EXPENSE", day: "2026-10-19", merchant: /POS/i, last4: "570" },
  { name: "BOC cents only (real)", text: "LKR .56 debited from AC\n**8462 for\nCEFTLV-01-98841328778478\n8-02-6289-03-000\n20/10/2026 11:25:31\nTo Inq Call\nGet protected -Do not Share\nOTP", amount: 56, type: "EXPENSE", day: "2026-10-20", merchant: /CEFT/i, last4: "8462" },
  { name: "Bakery photo (real)", text: "EW PERERA AND SON BAKERS\nNO 02B\nCOLOMBO ROAD CHILAW\n0322220441\nWELCOME\nCashier:Manager MachNo: 0007\nItem Qty Price Amount\nICE COFFE 2 200.00 400.00\nPATIS 2 140.00 280.00\nSubtotal 680.00\nSubtotal 680.00\nItem: 4\nTOTAL 680.00\nCash 1,000.00\nChange’ 320.00\n18-10-2026 16:21 34,711\nTHANK YOU\nCOME AGAIN", amount: 68000, type: "EXPENSE", day: "2026-10-18", merchant: /PERERA/i },
  { name: "Bakery photo, split decimals", text: "he}\n-\nEW PERERA AND SON BAKERS\nTOTAL 680. 00\nCash 1,000.00\nChange* 320.00\n18-10-2026 16:2]", amount: 68000, type: "EXPENSE", day: "2026-10-18", merchant: /PERERA/i },
  { name: "Card slip photo (real)", text: "UNSTOPPABLE YOU J\nSASHA FOOD J\nCOURT(PVT).L oD 1\nSALE\nCARD TYPE Visa (1 it\nAPP JIE \"8/7144\nhe. MOUNT LKR 5,870.00 ]\nSIGN: o", amount: 587000, type: "EXPENSE", day: TODAY, merchant: /SASHA/i },
  { name: "Bus ticket photo (real)", text: "wpNG-1111 ]\nLONIJA EXPRESS\nAT#:52771 Luxury-RT#:EX02/138/2%\nREF: 907070116257\nDATE:26-10-08 TIME:17:18:52\nROUTE: NEGOMBO-NAVINNA\nNAVINNA\n- NEGOMBO 0\nFULL: 1x 610.00 = 610-7\nTOTAL: Rs.610.00 .\nCONTACT FOR : 070644511", amount: 61000, type: "EXPENSE", day: "2026-10-08", merchant: /LONIJA/i },
  { name: "PickMe receipt (real)", text: "17:34 ut! 46 | TRIP ID - 1574573041 | Nisal 0702970984 | 276, Kulasiri Kumarage Mawatha, | o Homagama, Colombo | 2026-10-19 18:44 PM | Receipt Help | Estimated Fare LKR 167.07 | Estimated Duration 7 minutes 36 seconds | Estimated Distance 2.61km | Actual Fare LKR 167.07 | Actual Duration 7 minutes 22 seconds | Actual Distance 2.66 km | Total Trip Fare LKR 167.07 | Paid Amount LKR 167.07 | Paid by | (@) cash LKR 167.07 | Driver tip Tip Driver | 100% of your tip goes to the driver. | Help BE Mail Receipt".replaceAll(" | ", "\n"), amount: 16707, type: "EXPENSE", day: "2026-10-19", merchant: /PickMe/i, hint: "Cash" },
  { name: "PickMe summary, cut off (real)", text: "17:31 ut 4c ED | Nisal 0702970984 | 19 October 2026 | Io Rides 06:34 PM | Completed Rate now | Ganithage 4.6 | Bike | (o] Hiripitiya Road, Pannipitiya, Colombo | 2026-10-19 18:34 PM | Receipt Help | Estimated Fare LKR 167.07 | Estimated Duration 7 minutes 36 seconds | Actual Fare LKR 167.07 | Actual Duration 7 minutes 22 seconds".replaceAll(" | ", "\n"), amount: 16707, type: "EXPENSE", day: "2026-10-19", merchant: /PickMe/i, high: true },
  { name: "Uber ride details (real)", text: "X Ride Details | MAMBULGODA | Moto Saver | ride with | SOORIYA | ARACHCHILA | GE DINESH... | Oct 10 12:26PM | LKR 169.19 | [3] Receipt | 46/1/D Mabulgoda, Pannipitiya, : | Sri Lanka | No tip added Add tip | No rating Rate | Help & safety".replaceAll(" | ", "\n"), amount: 16919, type: "EXPENSE", day: "2026-10-10", merchant: /Uber/i, high: true },
  { name: "Uber ride receipt (real)", text: "7:33 1 4G GD | X | Receipt | We hope you enjoyed your ride this | evening. | Total LKR 337.80 | Trip fare LKR 317.80 | Booking Fee LKR 20.00 | Payments | Cash LKR 337.80 | 9/15/26 7:33 PM | Visit the trip page for more information, including | invoices (where available) | Uber does not provide transportation services; | Issued on behalf of KURUKULASURIYA RUMESH".replaceAll(" | ", "\n"), amount: 33780, type: "EXPENSE", day: "2026-09-15", merchant: /Uber/i, hint: "Cash" },
  { name: "Uber Eats receipt (real)", text: "17:34 it 4G EB | X | Here's your receipt for Feek Health | Mart . | Total LKR 330.33 | Panadol 500mg (12 | 2 Tablets) LKR 120.00 | Item Subtotal LKR 120.00 | Tax LKR 61.33 | Delivery Fee LKR 99.00 | Service Fee LKR 50.00 | Payments | Visa ++++8663 (Nisal - | visa Sampath Bank) LKR S20.55 | 10/4/26 8:10 AM | Tax includes the applicable tax on meal fare | collected on behalf of merchant partners and".replaceAll(" | ", "\n"), amount: 33033, type: "EXPENSE", day: "2026-10-04", merchant: /Feek Health Mart/i, last4: "8663", hint: "Sampath" },
];


describe("scan parser on typical bank SMS, emails and receipts", () => {
  for (const c of cases) {
    it(c.name, () => {
      const r = parseScan(c.text, TODAY)[0];
      assert.equal(r.amount.minor, c.amount, "amount");
      assert.equal(r.type.value, c.type, "type");
      assert.equal(r.date.day, c.day, "date");
      if (c.merchant) assert.match(r.merchant.text, c.merchant, "merchant");
      if (c.last4) assert.equal(r.account.last4, c.last4, "card digits");
      if (c.hint) assert.equal(r.account.hint, c.hint, "account hint");
      if (c.high) assert.equal(r.amount.confidence, "high", "amount confidence");
    });
  }

  it("splits a chat screenshot with three SMS into three transactions with their own dates", () => {
    const chat = "Saturday 13:00\nCEFT Transfer Debit Rs\n7025.00 From A/C No\nXXXXXXXXXX570. Balance\navailable Rs 3158.74 - Thank\nyou for banking with BOC\nSunday 15:28\nCEFT Transfer Debit Rs\n2025.00 From A/C No\nXXXXXXXXXX570. Balance\navailable Rs 1133.74 - Thank\nyou for banking with BOC\nYesterday 16:39\nPOS/ATM Transaction Rs\n171.26 From A/C No\nXXXXXXXXXX570. Balance\navailable Rs 962.48 - Thank\nyou for banking with BOC";
    const got = parseScan(chat, TODAY).map((r) => `${r.amount.minor}@${r.date.day}`);
    assert.deepEqual(got, ["702500@2026-10-17", "202500@2026-10-18", "17126@2026-10-19"]);
  });

  it("does not split one SMS at the date line inside it", () => {
    const one = parseScan("LKR .56 debited from AC\n**8462 for\nCEFTLV-01-98841328778478\n8-02-6289-03-000\n20/10/2026 11:25:31\nTo Inq Call\nGet protected -Do not Share\nOTP", TODAY);
    assert.equal(one.length, 1);
    assert.equal(one[0].date.day, "2026-10-20");
    assert.notEqual(one[0].date.confidence, "missing");
  });

  it("reads the card network from a receipt", () => {
    const account = parseScan("Visa ++++8663 (Nisal - Sampath Bank) LKR 330.33", TODAY)[0].account;
    assert.equal(account.network, "VISA");
    assert.equal(account.last4, "8663");
  });
});

describe("category suggestions", () => {
  const categories = [
    { id: "food", name: "Food & Dining", type: "EXPENSE" as const },
    { id: "groc", name: "Groceries", type: "EXPENSE" as const },
    { id: "trans", name: "Transport", type: "EXPENSE" as const },
    { id: "health", name: "Health", type: "EXPENSE" as const },
    { id: "salary", name: "Salary", type: "INCOME" as const },
  ];
  const pick = (merchant: string, type: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE", history: { note: string; categoryId: string | null }[] = [], context = "") =>
    suggestCategory(merchant, history, categories, type, context)?.categoryId ?? null;

  it("uses keywords, preferring the more specific category over the first one in the list", () => {
    assert.equal(pick("KEELLS SUPER"), "groc");
    assert.equal(pick("Uber ride"), "trans");
    assert.equal(pick("Feek Health Mart", "EXPENSE", [], "Panadol 500mg"), "health");
    assert.equal(pick("EW PERERA AND SON BAKERS"), "food");
  });

  it("prefers what the user already chose for the same merchant", () => {
    assert.equal(pick("SASHA FOOD", "EXPENSE", [{ note: "SASHA FOOD COURT", categoryId: "groc" }]), "groc");
  });

  it("only suggests categories of the right type, and none for transfers", () => {
    assert.equal(pick("", "INCOME", [], "Salary credit"), "salary");
    assert.equal(pick("Salary", "EXPENSE"), null);
    assert.equal(pick("KEELLS", "TRANSFER"), null);
  });
});
