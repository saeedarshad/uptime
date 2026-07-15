"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const GRAPHITE = "#242B33";
const SAFETY = "#E1622F";
const MUTED = "#9AA0A6";

function dollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(36,43,51,0.1)",
  boxShadow:
    "0 2px 4px rgba(18,22,27,0.05), 0 8px 20px -6px rgba(18,22,27,0.12)",
  fontSize: 12,
  padding: "8px 12px",
} as const;

export function CostByAssetChart({
  data,
}: {
  data: { name: string; cents: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-graphite/40">
        No maintenance costs in the last 90 days yet.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 46)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 52, bottom: 4, left: 8 }}
        barCategoryGap="28%"
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 12, fill: GRAPHITE, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(36,43,51,0.04)" }}
          contentStyle={tooltipStyle}
          formatter={(v: number) => [dollars(v), "Cost (90d)"]}
        />
        <Bar
          dataKey="cents"
          radius={[0, 6, 6, 0]}
          maxBarSize={26}
          label={{
            position: "right",
            formatter: dollars,
            fontSize: 11,
            fontWeight: 600,
            fill: GRAPHITE,
          }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? SAFETY : GRAPHITE} fillOpacity={i === 0 ? 1 : 0.82} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlySpendChart({
  data,
}: {
  data: { month: string; cents: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SAFETY} stopOpacity={1} />
            <stop offset="100%" stopColor={SAFETY} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: GRAPHITE, fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          dy={4}
        />
        <YAxis
          tickFormatter={dollars}
          tick={{ fontSize: 11, fill: MUTED }}
          axisLine={false}
          tickLine={false}
          width={54}
        />
        <Tooltip
          cursor={{ fill: "rgba(36,43,51,0.04)" }}
          contentStyle={tooltipStyle}
          formatter={(v: number) => [dollars(v), "Spend"]}
        />
        <Bar
          dataKey="cents"
          fill="url(#spendGradient)"
          radius={[6, 6, 0, 0]}
          maxBarSize={56}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
