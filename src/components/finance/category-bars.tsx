import type { CategoryBreakdown } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { CategoryIcon } from "@/lib/category-icons";

/**
 * Ranked part-to-whole list: one bar hue for magnitude, the category's own
 * color as a dot for identity, and the value + share always written out.
 */
export function CategoryBars({
  data,
  currency,
  limit,
}: {
  data: CategoryBreakdown;
  currency: string;
  limit?: number;
}) {
  const total = data.reduce((sum, row) => sum + row.total, 0);
  let rows = data;
  if (limit && data.length > limit) {
    const rest = data.slice(limit - 1);
    rows = [
      ...data.slice(0, limit - 1),
      {
        id: "__other",
        name: `Other (${rest.length})`,
        color: "#8a8984",
        icon: "other",
        total: rest.reduce((s, r) => s + r.total, 0),
        count: rest.reduce((s, r) => s + r.count, 0),
      },
    ];
  }
  const max = Math.max(...rows.map((r) => r.total), 1);

  return (
    <ul className="space-y-3.5">
      {rows.map((row) => {
        const share = total > 0 ? Math.round((row.total / total) * 100) : 0;
        return (
          <li key={row.id ?? "none"}>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                <CategoryIcon name={row.icon} className="size-4" style={{ color: row.color }} />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
              <span className="font-semibold tabular-nums">{formatMoney(row.total, currency)}</span>
              <span className="w-10 text-right text-xs text-ink-soft tabular-nums">{share}%</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-muted" aria-hidden>
              <div
                className="h-2.5 rounded-full"
                style={{ width: `${Math.max((row.total / max) * 100, 2)}%`, background: "var(--chart-bar)" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
