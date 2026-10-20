/**
 * Picks a category for a scanned merchant. The user's own history wins (a
 * merchant word they already filed under a category), then a small keyword
 * list. Only categories the user actually has, of the right type, can match.
 */
export type HistoryRow = { note: string; categoryId: string | null };
export type CategoryRef = { id: string; name: string; type: "INCOME" | "EXPENSE" };

const STOP = new Set(["the", "and", "pvt", "ltd", "plc", "co", "shop", "store", "pay", "payment", "to", "at", "of", "for"]);

export function words(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w));
}

// Keyword -> words that may appear in the category name.
const KEYWORDS: [RegExp, string[]][] = [
  [/pharmacy|hospital|clinic|medic|health|channeling/i, ["health", "medic", "pharm"]],
  [/keells|cargills|arpico|supermarket|grocer|\bmart\b|food\s*city|laugfs\s*super/i, ["grocer", "food", "shopping"]],
  [/restaurant|cafe|coffee|pizza|burger|kfc|mcdonald|dominos|bakery|bakers|\bfood\b|hotel|uber\s*eats|pickme\s*food/i, ["dining", "food", "restaurant", "eating"]],
  [/fuel|petrol|diesel|ceypetco|\bioc\b|\bshell\b/i, ["fuel", "transport", "vehicle", "car"]],
  [/uber|pickme|taxi|\bbus\b|express|train|toll|parking|ride/i, ["transport", "taxi", "travel"]],
  [/electricity|\bceb\b|\bleco\b|water\s*board|nwsdb|dialog|mobitel|\bslt\b|airtel|hutch|internet|broadband/i, ["bill", "utilit"]],
  [/cinema|netflix|spotify|movie|concert|\bgame/i, ["entertain", "fun", "subscription"]],
  [/salary|payroll|wages/i, ["salary", "income", "wage"]],
  [/\brent\b|landlord/i, ["rent", "housing", "home"]],
  [/school|tuition|university|\bcourse\b/i, ["education", "school"]],
];

export function suggestCategory(
  merchant: string,
  history: HistoryRow[],
  categories: CategoryRef[],
  type: "INCOME" | "EXPENSE" | "TRANSFER",
  /** The rest of the scanned text, only used for the keyword fallback ("Panadol", "fare"). */
  context = "",
): { categoryId: string; source: "history" | "keyword" } | null {
  if (type === "TRANSFER") return null;
  const usable = categories.filter((c) => c.type === type);
  if (usable.length === 0 || !(merchant.trim() || context.trim())) return null;
  const valid = new Set(usable.map((c) => c.id));

  const mine = new Set(words(merchant));
  if (mine.size > 0) {
    const votes = new Map<string, number>();
    for (const row of history) {
      if (!row.categoryId || !valid.has(row.categoryId)) continue;
      const shared = words(row.note).filter((w) => mine.has(w)).length;
      if (shared > 0) votes.set(row.categoryId, (votes.get(row.categoryId) ?? 0) + shared);
    }
    const best = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best) return { categoryId: best[0], source: "history" };
  }

  // Merchant text is a stronger signal than the surrounding text, so try it first.
  for (const haystack of [merchant, context]) {
    for (const [pattern, names] of KEYWORDS) {
      if (!pattern.test(haystack)) continue;
      // Try the names in order of preference, so "grocer" beats "food" even when
      // "Food & Dining" comes first in the user's list.
      for (const name of names) {
        const hit = usable.find((c) => c.name.toLowerCase().includes(name));
        if (hit) return { categoryId: hit.id, source: "keyword" };
      }
    }
  }
  return null;
}
