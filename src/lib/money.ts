/** All amounts are integers in minor units (1/100 of the currency). */

/** Local symbols that Intl does not produce, e.g. Sri Lankan "Rs." instead of "LKR". */
const SYMBOLS: Record<string, string> = {
  LKR: "Rs.",
};

function format(value: number, currency: string, options: Intl.NumberFormatOptions) {
  const symbol = SYMBOLS[currency];
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: symbol ? "code" : "symbol",
    ...options,
  });
  if (!symbol) {
    return formatter.format(value);
  }
  // Swap the ISO code for the local symbol, joined by a non-breaking space so "Rs." never wraps alone.
  return formatter
    .formatToParts(value)
    .map((part) => (part.type === "currency" ? symbol : part.type === "literal" ? "\u00a0" : part.value))
    .join("");
}

export function formatMoney(minor: number, currency: string, opts: { signed?: boolean } = {}) {
  const value = minor / 100;
  try {
    return format(value, currency, { signDisplay: opts.signed ? "exceptZero" : "auto" });
  } catch {
    return `${opts.signed && value > 0 ? "+" : ""}${value.toFixed(2)} ${currency}`;
  }
}

/** Compact number without a currency for chart axes, e.g. "1.2M". */
export function formatCompact(minor: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(minor / 100);
}

/** Parses user input like "1,234.5" into minor units. Returns null when invalid. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, "");
  if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) {
    return null;
  }
  return Math.round(Number(cleaned) * 100);
}

/** Minor units back to an input value, e.g. 123450 -> "1234.50". */
export function toInputAmount(minor: number) {
  return (minor / 100).toFixed(2);
}
