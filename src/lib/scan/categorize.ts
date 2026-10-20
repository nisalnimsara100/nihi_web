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
  [/keells|cargills|arpico|supermarket|grocer|mart|food\s*city|laugfs\s*super/i, ["grocer", "food", "shopping"]],
  [/restaurant|cafe|coffee|pizza|burger|kfc|mcdonald|dominos|bakery|hotel|uber\s*eats|pickme\s*food/i, ["dining", "food", "restaurant", "eating"]],
  [/fuel|petrol|diesel|ceypetco|ioc|lanka\s*ioc|shell/i, ["fuel", "transport", "vehicle", "car"]],
  [/uber|pickme|taxi|bus|train|toll|parking/i, ["transport", "taxi", "travel"]],
  [/electricity|ceb|leco|water\s*board|nwsdb|dialog|mobitel|slt|airtel|hutch|internet|broadband|bill/i, ["bill", "utilit"]],
  [/pharmacy|hospital|clinic|medic|health|channel|lab/i, ["health", "medic", "pharm"]],
  [/cinema|netflix|spotify|movie|concert|game/i, ["entertain", "fun", "subscription"]],
  [/salary|payroll|wages/i, ["salary", "income", "wage"]],
  [/rent|landlord/i, ["rent", "housing", "home"]],
  [/school|tuition|university|course|book/i, ["education", "school"]],
];

export function suggestCategory(
  merchant: string,
  history: HistoryRow[],
  categories: CategoryRef[],
  type: "INCOME" | "EXPENSE" | "TRANSFER",
): { categoryId: string; source: "history" | "keyword" } | null {
  if (type === "TRANSFER") return null;
  const usable = categories.filter((c) => c.type === type);
  if (usable.length === 0 || !merchant.trim()) return null;
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

  for (const [pattern, names] of KEYWORDS) {
    if (!pattern.test(merchant)) continue;
    const hit = usable.find((c) => names.some((n) => c.name.toLowerCase().includes(n)));
    if (hit) return { categoryId: hit.id, source: "keyword" };
  }
  return null;
}
