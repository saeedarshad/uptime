"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";
import { useThemeColors } from "@/lib/useThemeColors";

function dollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

export function CostByAssetChart({
  data,
}: {
  data: { name: string; cents: number }[];
}) {
  const c = useThemeColors();

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-content/40">
        No maintenance costs in the last 90 days yet.
      </p>
    );
  }

  const summary = data
    .map((d) => `${d.name}: ${dollars(d.cents)}`)
    .join(", ");

  return (
    <div role="img" aria-label={`Cost by asset over the last 90 days. ${summary}.`}>
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
            tick={{ fontSize: 12, fill: c.content, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: c.cursor }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${c.tooltipBorder}`,
              background: c.tooltipBg,
              color: c.content,
              boxShadow:
                "0 2px 4px rgba(18,22,27,0.05), 0 8px 20px -6px rgba(18,22,27,0.12)",
              fontSize: 12,
              padding: "8px 12px",
            }}
            itemStyle={{ color: c.content }}
            labelStyle={{ color: c.content }}
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
              fill: c.content,
            }}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? c.safety : c.content}
                fillOpacity={i === 0 ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlySpendChart({
  data,
}: {
  data: { month: string; cents: number }[];
}) {
  const c = useThemeColors();

  const summary = data
    .map((d) => `${d.month}: ${dollars(d.cents)}`)
    .join(", ");

  return (
    <div role="img" aria-label={`Monthly maintenance spend over 6 months. ${summary}.`}>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: 8 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.safety} stopOpacity={1} />
              <stop offset="100%" stopColor={c.safety} stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke={c.grid}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: c.content, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            dy={4}
          />
          <YAxis
            tickFormatter={dollars}
            tick={{ fontSize: 11, fill: c.contentMuted }}
            axisLine={false}
            tickLine={false}
            width={54}
          />
          <Tooltip
            cursor={{ fill: c.cursor }}
            contentStyle={{
              borderRadius: 12,
              border: `1px solid ${c.tooltipBorder}`,
              background: c.tooltipBg,
              color: c.content,
              boxShadow:
                "0 2px 4px rgba(18,22,27,0.05), 0 8px 20px -6px rgba(18,22,27,0.12)",
              fontSize: 12,
              padding: "8px 12px",
            }}
            itemStyle={{ color: c.content }}
            labelStyle={{ color: c.content }}
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
    </div>
  );
}
