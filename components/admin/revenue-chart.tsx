"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/format";

type Point = { date: string; paise: number };

export function RevenueChart({ data }: { data: Point[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    rupees: d.paise / 100,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formatted} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5F7A52" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#5F7A52" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E8DFD0" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#7c7368" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#7c7368" }}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={(v) =>
            Number(v) >= 1000
              ? `₹${(Number(v) / 1000).toFixed(1)}k`
              : `₹${v}`
          }
        />
        <Tooltip
          formatter={(value) => [formatINR(Number(value) * 100), "Revenue"]}
          contentStyle={{
            background: "#fff",
            border: "1px solid #E8DFD0",
            borderRadius: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="rupees"
          stroke="#5F7A52"
          strokeWidth={2}
          fill="url(#g-rev)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
