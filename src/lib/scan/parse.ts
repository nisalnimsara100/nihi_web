/**
 * Turns OCR text from a bank SMS, bank email or printed bill into transaction
 * fields. Pure functions with no browser APIs, so they can be tested with tsx.
 * Every field reports how sure the rules are; the UI never saves silently.
 */
import { parseAmount as toMinor } from "../money";

export type Confidence = "high" | "low" | "missing";
export type ScanType = "EXPENSE" | "INCOME" | "TRANSFER";

export type ParsedScan = {
  amount: { minor: number | null; currency: string | null; confidence: Confidence };
  type: { value: ScanType; confidence: Confidence };
  date: { day: string; confidence: Confidence };
  merchant: { text: string; confidence: Confidence };
  account: { hint: string; last4: string | null; confidence: Confidence };
};

const CURRENCY_WORDS: Record<string, string> = {
  LKR: "LKR", RS: "LKR", "රු": "LKR", USD: "USD", $: "USD", EUR: "EUR", "€": "EUR",
  GBP: "GBP", "£": "GBP", INR: "INR",
};

const MONEY = /(LKR|Rs\.?|රු\.?|USD|EUR|GBP|INR|\$|£|€)\s*(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;

const PAID_WORDS = /\b(debited|paid|payment|purchase|spent|withdrawn|withdrawal|sent|total|grand\s*total|net\s*amount|amount|txn|transaction|credited|received|deposit)\b/i;
const IGNORE_WORDS = /\b(balance|bal|available|avl|limit|fee|fees|charge|charges|outstanding|points)\b/i;

function normalise(text: string) {
  // OCR often reads "Rs" as "Rs," or "R5"; keep fixes conservative.
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\bR[sS]\s*[,:]/g, "Rs.");
}

function currencyOf(token: string) {
  const key = token.replace(/\.$/, "").toUpperCase();
  return CURRENCY_WORDS[key] ?? CURRENCY_WORDS[token] ?? null;
}

export function parseAmount(text: string): ParsedScan["amount"] {
  const lines = normalise(text).split("\n");
  type Hit = { minor: number; currency: string | null; score: number };
  const hits: Hit[] = [];
  lines.forEach((line, index) => {
    for (const m of line.matchAll(MONEY)) {
      const minor = toMinor(m[2]);
      if (minor === null || minor <= 0) continue;
      const before = line.slice(0, m.index);
      // A balance on the same line as the amount ("Avl Bal Rs. 5,000") is not the payment.
      const ignored = IGNORE_WORDS.test(before.slice(-22));
      let score = 1;
      if (PAID_WORDS.test(before.slice(-40)) || PAID_WORDS.test(line)) score += 3;
      if (/\b(total|grand\s*total|net\s*amount)\b/i.test(line)) score += 2;
      if (/\.\d{2}$/.test(m[2])) score += 1;
      if (ignored) score -= 10;
      score -= index * 0.01; // earlier lines win ties
      hits.push({ minor, currency: currencyOf(m[1]), score });
    }
  });
  // Printed bills often print totals without a currency sign ("Grand Total 1,980.00").
  lines.forEach((line, index) => {
    const m = line.match(/\b(grand\s*total|net\s*amount|net\s*total|total\s*due|amount\s*due|total)\b[^\d\n]{0,12}(\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})\s*$/i);
    if (!m || /\bsub\s*total\b/i.test(m[1]) || /\bsub\s*-?\s*total\b/i.test(line)) return;
    const minor = toMinor(m[2]);
    if (minor && minor > 0) hits.push({ minor, currency: null, score: 6 - index * 0.01 });
  });
  const usable = hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score);
  if (usable.length === 0) {
    return { minor: null, currency: null, confidence: "missing" };
  }
  const best = usable[0];
  const rivals = usable.filter((h) => h.minor !== best.minor && h.score >= best.score - 0.5);
  return { minor: best.minor, currency: best.currency, confidence: rivals.length === 0 && best.score >= 3 ? "high" : "low" };
}

export function parseType(text: string): ParsedScan["type"] {
  const t = text.toLowerCase();
  const income = /\b(credited|received|deposit(?:ed)?|salary|refund(?:ed)?|cashback)\b/.test(t);
  const expense = /\b(debited|purchase|paid|payment|withdrawal|withdrawn|pos|spent|sent|bill)\b/.test(t);
  const transfer = /\b(fund\s*transfer|transfer(?:red)?|own\s*account)\b/.test(t);
  if (transfer && !(income && expense)) return { value: "TRANSFER", confidence: "low" };
  if (income && !expense) return { value: "INCOME", confidence: "high" };
  if (expense && !income) return { value: "EXPENSE", confidence: "high" };
  if (income && expense) {
    // "credited to X ... debited from Y": the first mention is the account's own side.
    const i = t.search(/\b(credited|received|deposit)/);
    const e = t.search(/\b(debited|purchase|paid|withdrawn)/);
    return { value: i >= 0 && (e < 0 || i < e) ? "INCOME" : "EXPENSE", confidence: "low" };
  }
  return { value: "EXPENSE", confidence: "low" };
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function fullYear(y: number) {
  return y < 100 ? 2000 + y : y;
}

function validDay(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  if (date.getUTCMonth() !== m - 1) return null;
  return date.toISOString().slice(0, 10);
}

export function parseDate(text: string, today: string): ParsedScan["date"] {
  const t = normalise(text);
  let m: RegExpMatchArray | null;

  if ((m = t.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/))) {
    const day = validDay(+m[1], +m[2], +m[3]);
    if (day) return { day, confidence: "high" };
  }
  if ((m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]{3,9})\.?,?[\s-]+(\d{2,4})\b/))) {
    const mi = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    const day = mi >= 0 ? validDay(fullYear(+m[3]), mi + 1, +m[1]) : null;
    if (day) return { day, confidence: "high" };
  }
  if ((m = t.match(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/))) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    const day = mi >= 0 ? validDay(+m[3], mi + 1, +m[2]) : null;
    if (day) return { day, confidence: "high" };
  }
  if ((m = t.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/))) {
    const a = +m[1];
    const b = +m[2];
    const y = fullYear(+m[3]);
    // Day-first (Sri Lanka); swap only when day-first is impossible.
    const first = validDay(y, b, a);
    if (first) return { day: first, confidence: a <= 12 && b <= 12 && a !== b ? "low" : "high" };
    const swapped = validDay(y, a, b);
    if (swapped) return { day: swapped, confidence: "low" };
  }
  if (/\btoday\b/i.test(t)) return { day: today, confidence: "high" };
  return { day: today, confidence: "missing" };
}

const BANKS = [
  "Commercial Bank", "Sampath", "HNB", "Hatton National", "BOC", "Bank of Ceylon", "People's Bank",
  "Seylan", "NDB", "NTB", "Nations Trust", "DFCC", "Pan Asia", "Union Bank", "Cargills Bank",
  "Amana", "PayHere", "FriMi", "Genie", "HSBC", "Standard Chartered", "Dialog", "Mobitel",
];

export function parseAccountHint(text: string): ParsedScan["account"] {
  const t = normalise(text);
  const last4 =
    t.match(/\b(?:a\/?c|acc(?:ount)?|card)\s*(?:no\.?|number|ending|ends|#)?\s*(?:with)?\s*[:\-]?\s*[x*•.]*\s*(\d{4})\b/i)?.[1] ??
    t.match(/[x*•]{2,}\s*(\d{4})\b/i)?.[1] ??
    null;
  const lower = t.toLowerCase();
  const bank = BANKS.find((b) => lower.includes(b.toLowerCase())) ?? "";
  return { hint: bank, last4, confidence: last4 || bank ? "low" : "missing" };
}

const MERCHANT_CUE = /\b(?:paid\s+to|payment\s+to|purchase\s+at|spent\s+at|merchant|vpa|to|at|from)\s*[:\-]?\s+(?=([A-Za-z0-9][A-Za-z0-9 &'.\-_/@]{2,40}))/gi; // lookahead so one cue's text never hides the next cue
const MERCHANT_STOP = /\s+(?:on|via|using|ref|reference|txn|transaction|dated|date|for|with|has|is|was|using|card|a\/c|ac|avl|available|balance|bal|rs|lkr|usd)\b.*$/i;
const NOISE_LINE = /^(?:\W*\d[\d\s:/.,-]*|.*\b(?:invoice|receipt|bill\s*no|tel|phone|cashier|date|time|qty|vat|tax|subtotal|total|thank)\b.*)$/i;

function cleanMerchant(raw: string) {
  return raw.replace(MERCHANT_STOP, "").replace(/[.,;:\-_\s]+$/, "").replace(/\s+/g, " ").trim();
}

export function parseMerchant(text: string): ParsedScan["merchant"] {
  const flat = normalise(text).replace(/\n/g, " ");
  for (const cue of flat.matchAll(MERCHANT_CUE)) {
    const merchant = cleanMerchant(cue[1]);
    // "at 2026-10-20", "from A/C xx7788" or "to your account" are not merchants.
    if (merchant.length >= 3 && !/^\d/.test(merchant) && !/^(?:your|the|a\/c|ac|account|card|you|my|x{2,}|\*)/i.test(merchant)) {
      return { text: merchant, confidence: "high" };
    }
  }
  // Printed bills put the shop name first.
  for (const line of normalise(text).split("\n").slice(0, 6)) {
    const trimmed = line.trim();
    if (trimmed.length >= 3 && /[A-Za-z]{3}/.test(trimmed) && !NOISE_LINE.test(trimmed)) {
      return { text: trimmed.slice(0, 60), confidence: "low" };
    }
  }
  return { text: "", confidence: "missing" };
}

export function parseScan(text: string, today: string): ParsedScan {
  return {
    amount: parseAmount(text),
    type: parseType(text),
    date: parseDate(text, today),
    merchant: parseMerchant(text),
    account: parseAccountHint(text),
  };
}
