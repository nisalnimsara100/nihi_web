"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { formatCompact, formatMoney } from "@/lib/money";

export type TrendPoint = { label: string; fullLabel: string; income: number; expense: number };

const SERIES = [
  { key: "income", label: "Income", color: "var(--chart-income)" },
  { key: "expense", label: "Expenses", color: "var(--chart-expense)" },
] as const;

function TrendTooltip({ active, payload, currency }: TooltipContentProps<number, string> & { currency: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as TrendPoint;
  return (
    <div className="rounded-2xl bg-forest px-3.5 py-2.5 text-sm text-on-forest shadow-xl">
      <p className="mb-1 font-medium">{point.fullLabel}</p>
      {SERIES.map((s) => (
        <p key={s.key} className="flex items-center gap-2 text-on-forest/80">
          <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
          <span className="flex-1">{s.label}</span>
          <span className="font-bold text-on-forest tabular-nums">{formatMoney(point[s.key], currency)}</span>
        </p>
      ))}
      <p className="mt-1.5 border-t border-white/15 pt-1.5 text-on-forest/70 tabular-nums">
        Net {formatMoney(point.income - point.expense, currency, { signed: true })}
      </p>
    </div>
  );
}

export function TrendChart({ data, currency }: { data: TrendPoint[]; currency: string }) {
  return (
    <div>
      <ul className="mb-3 flex gap-4 text-sm font-medium text-ink-soft" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            {s.label}
          </li>
        ))}
      </ul>
      <div className="h-64 sm:h-72" role="img" aria-label={`Monthly income and expenses in ${currency}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="24%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
              tickFormatter={(v: number) => formatCompact(v)}
            />
            <Tooltip
              cursor={{ fill: "var(--chart-cursor)" }}
              content={(props) => <TrendTooltip {...(props as TooltipContentProps<number, string>)} currency={currency} />}
            />
            {SERIES.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={22} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
