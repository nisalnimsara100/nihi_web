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
  account: { hint: string; last4: string | null; network: string; confidence: Confidence };
};

const CURRENCY_WORDS: Record<string, string> = {
  LKR: "LKR", RS: "LKR", "රු": "LKR", USD: "USD", $: "USD", EUR: "EUR", "€": "EUR",
  GBP: "GBP", "£": "GBP", INR: "INR",
};

// The number may sit on the next line ("Rs\n7025.00") and may lack a leading zero (".56").
const MONEY = /(LKR|Rs\.?|රු\.?|USD|EUR|GBP|INR|\$|£|€)\s*(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?|\.\d{1,2})/gi;

const PAID_WORDS = /\b(debited|debit|fare|paid|payment|purchase|spent|withdrawn|withdrawal|sent|sale|total|grand\s*total|net\s*amount|amount|txn|transaction|credited|credit|received|deposit)\b/i;
const IGNORE_WORDS = /\b(balance|bal|available|avl|limit|fee|fees|charge|charges|outstanding|points|cash|change|tendered)\b/i;

function normalise(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    // OCR often reads "Rs" as "Rs," or "Rs:".
    .replace(/\bR[sS]\s*[,:]/g, "Rs.")
    // "680. 00" and "680 .00": OCR splits the decimals.
    .replace(/(\d)\s*\.\s+(\d{2})\b/g, "$1.$2")
    .replace(/(\d)\s+\.(\d{2})\b/g, "$1.$2");
}

function currencyOf(token: string) {
  const key = token.replace(/\.$/, "").toUpperCase();
  return CURRENCY_WORDS[key] ?? CURRENCY_WORDS[token] ?? null;
}

function minorOf(numberText: string) {
  return toMinor(numberText.startsWith(".") ? `0${numberText}` : numberText);
}

export function parseAmount(text: string): ParsedScan["amount"] {
  const t = normalise(text);
  type Hit = { minor: number; currency: string | null; score: number };
  const hits: Hit[] = [];

  for (const m of t.matchAll(MONEY)) {
    const minor = minorOf(m[2]);
    if (minor === null || minor <= 0) continue;
    const at = m.index ?? 0;
    const lineStart = t.lastIndexOf("\n", at) + 1;
    const lineEnd = t.indexOf("\n", at);
    const line = t.slice(lineStart, lineEnd < 0 ? undefined : lineEnd);
    const before = t.slice(lineStart, at);
    // A labelled balance ("Balance available Rs 3158.74") is not the payment. The label
    // may be on the previous line when the SMS wraps, so look a little further back.
    const lead = t.slice(Math.max(0, at - 24), at);
    const ignored = IGNORE_WORDS.test(lead) && !PAID_WORDS.test(lead.slice(-10));
    let score = 1;
    if (PAID_WORDS.test(before.slice(-40)) || PAID_WORDS.test(line)) score += 3;
    if (/\b(total|grand\s*total|net\s*amount)\b/i.test(line)) score += 2;
    if (/\.\d{2}$/.test(m[2])) score += 1;
    // Ride apps print an estimate above the real fare; prefer the actual one.
    if (/\bestimated\b/i.test(line)) score -= 1;
    if (ignored) score -= 10;
    score -= (at / Math.max(1, t.length)) * 0.5; // earlier text wins ties
    hits.push({ minor, currency: currencyOf(m[1]), score });
  }

  // Printed bills often print totals without a currency sign ("TOTAL 680.00").
  const lines = t.split("\n");
  lines.forEach((line, index) => {
    const m = line.match(/\b(grand\s*total|net\s*amount|net\s*total|total\s*due|amount\s*due|total|amount)\b[^\d\n]{0,14}(\d{1,3}(?:,\d{3})*\.\d{2}|\d+\.\d{2})\s*$/i);
    if (!m || /sub\s*-?\s*total/i.test(line)) return;
    const minor = minorOf(m[2]);
    if (minor && minor > 0) hits.push({ minor, currency: null, score: 6 - index * 0.01 });
  });

  const usable = hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score);
  if (usable.length === 0) {
    return { minor: null, currency: null, confidence: "missing" };
  }
  const best = usable[0];
  const rivals = usable.filter((h) => h.minor !== best.minor && h.score >= best.score - 0.5);
  const currency = best.currency ?? usable.find((h) => h.minor === best.minor && h.currency)?.currency ?? null;
  // One amount on the whole image (a ride summary with just "LKR 169.19") is not ambiguous.
  const onlyOne = usable.every((h) => h.minor === best.minor);
  return { minor: best.minor, currency, confidence: rivals.length === 0 && (best.score >= 3 || onlyOne) ? "high" : "low" };
}

export function parseType(text: string): ParsedScan["type"] {
  const t = text.toLowerCase();
  const income = /\b(credited|received|deposit(?:ed)?|salary|refund(?:ed)?|cashback)\b|\btransfer\s+credit\b/.test(t);
  const expense = /\b(debited|debit|purchase|paid|payment|withdrawal|withdrawn|pos|atm|spent|sent|sale|bill|total)\b/.test(t);
  // "CEFT Transfer Debit" is money leaving, so a debit/credit word beats the word "transfer".
  // A plain transfer with no direction may be between the user's own accounts.
  const transfer = /\b(fund\s*transfer|transfer(?:red)?|own\s*account)\b/.test(t);
  if (income && !expense) return { value: "INCOME", confidence: "high" };
  if (expense && !income) return { value: "EXPENSE", confidence: "high" };
  if (income && expense) {
    // "credited to X ... debited from Y": the first mention is the account's own side.
    const i = t.search(/\b(credited|received|deposit)/);
    const e = t.search(/\b(debited|debit|purchase|paid|withdrawn)/);
    return { value: i >= 0 && (e < 0 || i < e) ? "INCOME" : "EXPENSE", confidence: "low" };
  }
  if (transfer) return { value: "TRANSFER", confidence: "low" };
  return { value: "EXPENSE", confidence: "low" };
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function fullYear(y: number) {
  return y < 100 ? 2000 + y : y;
}

function validDay(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  if (date.getUTCMonth() !== m - 1) return null;
  return date.toISOString().slice(0, 10);
}

function addDays(day: string, delta: number) {
  const d = new Date(`${day}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** A scanned payment is never far in the future, and rarely years old. */
function plausible(day: string, today: string) {
  return day <= addDays(today, 1) && day >= addDays(today, -366 * 3);
}

/** "Yesterday", "Saturday" (the latest one before today) or "Today", as a message app prints them. */
export function relativeDay(word: string, today: string): string | null {
  const w = word.toLowerCase();
  if (w === "today") return today;
  if (w === "yesterday") return addDays(today, -1);
  const index = WEEKDAYS.indexOf(w.slice(0, 3));
  if (index < 0) return null;
  const todayIndex = new Date(`${today}T12:00:00.000Z`).getUTCDay();
  const back = ((todayIndex - index + 7) % 7) || 7;
  return addDays(today, -back);
}

export function parseDate(text: string, today: string): ParsedScan["date"] {
  const t = normalise(text);
  const named: string[] = [];

  for (const m of t.matchAll(/(?<![\d/-])(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?![\d/-])/g)) {
    const day = validDay(+m[1], +m[2], +m[3]);
    if (day && plausible(day, today)) return { day, confidence: "high" };
  }
  for (const m of t.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]{3,9})\.?,?[\s-]+(\d{2,4})\b/g)) {
    const mi = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase());
    const day = mi >= 0 ? validDay(fullYear(+m[3]), mi + 1, +m[1]) : null;
    if (day && plausible(day, today)) return { day, confidence: "high" };
  }
  for (const m of t.matchAll(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g)) {
    const mi = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
    const day = mi >= 0 ? validDay(+m[3], mi + 1, +m[2]) : null;
    if (day && plausible(day, today)) return { day, confidence: "high" };
  }
  for (const m of t.matchAll(/(?<![\d/-])(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?![\d/-])/g)) {
    const [a, b, c] = [+m[1], +m[2], +m[3]];
    const full = m[3].length === 4;
    // Every reading that is a real, recent date. Day-first (Sri Lanka) comes first;
    // "26-10-08" (year first) and "9/15/26" (month first, as the Uber app prints) follow.
    const readings = full
      ? [validDay(c, b, a), validDay(c, a, b)]
      : [validDay(2000 + c, b, a), validDay(2000 + a, b, c), validDay(2000 + c, a, b)];
    const options = [...new Set(readings.filter((d): d is string => !!d && plausible(d, today)))];
    if (options.length === 0) continue;
    if (options.length === 1) return { day: options[0], confidence: "high" };
    // Still ambiguous ("10/4/26"). A time with AM/PM after a slash date is the US style.
    const after = t.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 14);
    const monthFirst = m[0].includes("/") && /^\s*,?\s*\d{1,2}:\d{2}\s*[AP]M/i.test(after);
    const usReading = full ? readings[1] : readings[2];
    if (monthFirst && usReading && options.includes(usReading)) return { day: usReading, confidence: "low" };
    // Otherwise the reading closest to today: a payment screenshot is almost always recent.
    const distance = (d: string) => Math.abs(new Date(`${d}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime());
    const closest = [...options].sort((x, y) => distance(x) - distance(y) || options.indexOf(x) - options.indexOf(y))[0];
    return { day: closest, confidence: "low" };
  }
  // "Oct 10 12:26PM": a month and day with no year means the latest such day not in the future.
  for (const m of t.matchAll(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b(?!\s*,?\s*\d{4})/gi)) {
    const mi = MONTHS.indexOf(m[1].toLowerCase());
    const year = +today.slice(0, 4);
    let day = validDay(year, mi + 1, +m[2]);
    if (day && day > addDays(today, 1)) day = validDay(year - 1, mi + 1, +m[2]);
    if (day && plausible(day, today)) return { day, confidence: "high" };
  }
  for (const m of t.matchAll(/\b(today|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi)) {
    named.push(m[1]);
  }
  if (named.length > 0) {
    const day = relativeDay(named[0], today);
    if (day) return { day, confidence: "high" };
  }
  return { day: today, confidence: "missing" };
}

const BANKS = [
  "Commercial Bank", "Sampath", "HNB", "Hatton National", "BOC", "Bank of Ceylon", "People's Bank",
  "Seylan", "NDB", "NTB", "Nations Trust", "DFCC", "Pan Asia", "Union Bank", "Cargills Bank",
  "Amana", "PayHere", "FriMi", "Genie", "HSBC", "Standard Chartered", "Dialog", "Mobitel",
];

export function parseAccountHint(text: string): ParsedScan["account"] {
  const t = normalise(text);
  // Masked numbers keep 3 or 4 digits: "XXXXXXXXXX570", "**8462", "A/C ending 4521".
  const last4 =
    t.match(/\b(?:a\/?c|acc(?:ount)?|card)\s*(?:no\.?|number|ending|ends|#)?\s*(?:with)?\s*[:\-]?\s*[x*•.]*\s*(\d{3,4})\b/i)?.[1] ??
    t.match(/\b(?:visa|master(?:card)?|amex)\s*[x*•+·.]{2,}\s*(\d{4})\b/i)?.[1] ??
    t.match(/[x*•+·]{3,}\s*(\d{3,4})\b/i)?.[1] ??
    t.match(/[x*•]{2,}\s*(\d{3,4})\b/i)?.[1] ??
    null;
  const lower = t.toLowerCase();
  const bank = BANKS.find((b) => new RegExp(`\\b${b.toLowerCase().replace(/[.*+?^${}()|[\]\\']/g, "\\$&")}\\b`).test(lower)) ?? "";
  // A receipt paid in cash ("Paid by Cash", "Cash LKR 337.80") belongs to the Cash account.
  const cash = !bank && !last4 && /\bcash\b/i.test(t) ? "Cash" : "";
  const hint = bank || cash;
  const network = /\bvisa\b/i.test(t) ? "VISA" : /\bmaster\s*card\b|\bmaster\b/i.test(t) ? "MASTERCARD" : /\bamex\b|american\s+express/i.test(t) ? "AMEX" : /\bunion\s*pay\b/i.test(t) ? "UNIONPAY" : /\bjcb\b/i.test(t) ? "JCB" : "";
  return { hint, last4, network, confidence: last4 || hint ? "low" : "missing" };
}

/**
 * Ride-hailing receipts name the driver, not a shop, so they get the app's name instead.
 * PickMe's layout is "TRIP ID ... Estimated Fare"; Uber's mentions its products.
 */
function rideLabel(text: string) {
  if (/\b(uber|moto\s*saver|uberx)\b/i.test(text) && /\b(ride|trip|fare|driver)\b/i.test(text)) return "Uber ride";
  // A scroll-cropped screenshot may lack the "TRIP ID" heading, but still shows fare and duration/distance.
  if (/\b(estimated|actual|total\s+trip)\s+fare\b/i.test(text) && (/\btrip\s*id\b/i.test(text) || /\b(duration|distance)\b/i.test(text))) return "PickMe ride";
  if (/\bride\s+details\b/i.test(text)) return "Ride";
  return "";
}

const RECEIPT_FOR = /\b(?:receipt\s+for|order\s+from|your\s+order\s+at)\s+([A-Za-z0-9][A-Za-z0-9 &'.\-_/]{2,40})/i;

const MERCHANT_CUE = /\b(?:paid\s+to|payment\s+to|purchase\s+at|spent\s+at|merchant|vpa|to|at|from)\s*[:\-]?\s+(?=([A-Za-z0-9][A-Za-z0-9 &'.\-_/@]{2,40}))/gi; // lookahead so one cue's text never hides the next cue
const MERCHANT_STOP = /\s+(?:on|via|using|ref|reference|txn|transaction|dated|date|for|with|has|is|was|card|a\/c|ac|avl|available|balance|bal|rs|lkr|usd)\b.*$/i;
// Words that mean the text after "to"/"at" is boilerplate ("To Inq Call ...") and not a shop.
const BOILERPLATE = /\b(inq|inquiry|call|protected|otp|thank|hotline|contact|share|click|visit|download|banking)\b/i;
const NOISE_LINE = /\b(invoice|receipt|bill\s*no|tel|phone|cashier|date|time|qty|vat|tax|subtotal|total|thank|welcome|unstoppable|machno|item|price|amount|hotline|contact|route|ref)\b/i;

function cleanMerchant(raw: string) {
  return raw.replace(MERCHANT_STOP, "").replace(/[.,;:\-_\s]+$/, "").replace(/\s+/g, " ").trim();
}

/** What a bank SMS calls the channel, when it names no shop ("CEFT Transfer Debit", "POS/ATM Transaction"). */
function channelLabel(text: string) {
  if (/\bCEFT\w*\b/i.test(text)) return "CEFT transfer";
  if (/\bSLIPS\b/i.test(text)) return "SLIPS transfer";
  if (/\bPOS\s*\/\s*ATM\b/i.test(text)) return "POS/ATM";
  if (/\bATM\b/i.test(text)) return "ATM withdrawal";
  if (/\bPOS\b/i.test(text)) return "POS purchase";
  return "";
}

const BANK_SMS = /\b(a\/?c|acc(?:ount)?|balance|debited|credited|debit|credit)\b/i;

export function parseMerchant(text: string): ParsedScan["merchant"] {
  const norm = normalise(text);
  const flat = norm.replace(/\n/g, " ");
  // Delivery receipts: "Here's your receipt for Feek Health Mart ."
  const named = flat.match(RECEIPT_FOR);
  if (named) {
    // The name may wrap onto the next line and run into "Mart . Total"; stop at the sentence end.
    const merchant = cleanMerchant(named[1].split(/\s+\.(?:\s|$)|\s+total\b/i)[0]);
    if (merchant.length >= 3 && /[A-Za-z]{3}/.test(merchant)) return { text: merchant, confidence: "high" };
  }
  const ride = rideLabel(flat);
  if (ride) return { text: ride, confidence: "low" };
  for (const cue of flat.matchAll(MERCHANT_CUE)) {
    const merchant = cleanMerchant(cue[1]);
    // "at 2026-10-20", "from A/C xx7788" or "to your account" are not merchants.
    if (
      merchant.length >= 3 &&
      /[A-Za-z]{3}/.test(merchant) &&
      !/^\d/.test(merchant) &&
      !/^(?:your|the|a\/c|ac|account|card|you|my|x{2,}|\*|no\b)/i.test(merchant) &&
      !BOILERPLATE.test(merchant)
    ) {
      return { text: merchant, confidence: "high" };
    }
  }
  if (BANK_SMS.test(flat)) {
    const label = channelLabel(flat);
    if (label) return { text: label, confidence: "low" };
  }
  // Printed bills put the shop name near the top, in mostly letters. OCR junk
  // ("he}", "wpNG-1111") has few letters or tiny words, so it is skipped.
  for (const line of norm.split("\n").slice(0, 8)) {
    // Logos and borders read as stray symbols ("© LONIJA EXPRESS"): drop them from the start.
    const trimmed = line.trim().replace(/^[^A-Za-z0-9]+/, "");
    const letters = (trimmed.match(/[A-Za-z]/g) ?? []).length;
    const words = trimmed.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
    const avg = words.length ? words.reduce((n, w) => n + w.replace(/[^A-Za-z]/g, "").length, 0) / words.length : 0;
    if (letters >= 5 && letters / trimmed.length >= 0.75 && avg >= 3 && !NOISE_LINE.test(trimmed)) {
      // Drop a stray trailing character that OCR read from the edge of the paper ("SASHA FOOD 0").
      return { text: trimmed.replace(/\s+\S$/, "").slice(0, 60), confidence: "low" };
    }
  }
  return { text: "", confidence: "missing" };
}

// A line like "Saturday 13:00", "Yesterday 16:39" or "18 Oct 2026 15:28" that a
// message app prints above each SMS; each one starts a new transaction.
const HEADER_LINE = /^\s*(?:(today|yesterday|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)|(\d{1,2}[\s/.-][A-Za-z0-9]{1,9}[\s/.,-]+\d{2,4}))[ ,]*(?:at\s*)?\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AP]M)?\s*$/i;

function splitMessages(text: string): { header: string; body: string }[] {
  const blocks: { header: string; body: string }[] = [];
  let current: { header: string; lines: string[] } = { header: "", lines: [] };
  const flush = () => {
    const body = current.lines.join("\n").trim();
    if (body) blocks.push({ header: current.header, body });
  };
  for (const line of normalise(text).split("\n")) {
    if (HEADER_LINE.test(line)) {
      flush();
      current = { header: line.trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  flush();
  // A date/time line only starts a new message when money follows it. Inside one SMS
  // ("... 20/10/2026 11:25:31 To Inq Call ...") it is just part of the text.
  const merged: typeof blocks = [];
  for (const block of blocks) {
    const prev = merged[merged.length - 1];
    if (prev && block.header && parseAmount(block.body).minor === null) {
      prev.body += `\n${block.header}\n${block.body}`;
    } else {
      merged.push({ ...block });
    }
  }
  return merged;
}

function parseBlock(body: string, header: string, today: string): ParsedScan {
  const own = parseDate(body, today);
  const fromHeader = header ? parseDate(header, today) : null;
  const date = own.confidence !== "missing" ? own : fromHeader && fromHeader.confidence !== "missing" ? fromHeader : own;
  return {
    amount: parseAmount(body),
    type: parseType(body),
    date,
    merchant: parseMerchant(body),
    account: parseAccountHint(body),
  };
}

/**
 * One result per transaction in the text. A chat screenshot can hold several
 * SMS; each message with an amount becomes its own result. Always returns at
 * least one result (with a missing amount when nothing was found).
 */
export function parseScan(text: string, today: string): ParsedScan[] {
  const blocks = splitMessages(text);
  if (blocks.length > 1) {
    const found = blocks.map((b) => parseBlock(b.body, b.header, today)).filter((r) => r.amount.minor !== null);
    if (found.length > 0) return found;
  }
  return [parseBlock(blocks.length === 1 ? blocks[0].body : text, blocks.length === 1 ? blocks[0].header : "", today)];
}
