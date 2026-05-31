"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { name: string; qty: number; revenue: number };

export function TopProductsChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 12 }}>
        <CartesianGrid stroke="#E8DFD0" strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#7c7368" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: "#3a342c" }}
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <Tooltip
          formatter={(value) => [`${value}`, "Units sold"]}
          contentStyle={{
            background: "#fff",
            border: "1px solid #E8DFD0",
            borderRadius: 12,
          }}
        />
        <Bar dataKey="qty" fill="#5F7A52" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
