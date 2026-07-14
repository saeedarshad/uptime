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

function dollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

export function CostByAssetChart({
  data,
}: {
  data: { name: string; cents: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-graphite/40">
        No maintenance costs in the last 90 days yet.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 46)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 12, fill: GRAPHITE }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          formatter={(v: number) => [dollars(v), "Cost (90d)"]}
        />
        <Bar dataKey="cents" radius={[0, 4, 4, 0]} label={{ position: "right", formatter: dollars, fontSize: 11, fill: GRAPHITE }}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? SAFETY : GRAPHITE} />
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
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: GRAPHITE }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={dollars}
          tick={{ fontSize: 11, fill: "#8a8f94" }}
          axisLine={false}
          tickLine={false}
          width={54}
        />
        <Tooltip formatter={(v: number) => [dollars(v), "Spend"]} />
        <Bar dataKey="cents" fill={SAFETY} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
