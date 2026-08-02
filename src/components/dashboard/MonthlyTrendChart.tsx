"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface TrendDay {
  date: string;
  day: string;
  bunches: number;
  tons: number;
}

export default function MonthlyTrendChart({ data, bunchLabel, tonsLabel }: { data: TrendDay[]; bunchLabel: string; tonsLabel: string }) {
  return (
    <div className="card-glow rounded-2xl p-3 sm:p-5" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--chart-bunches)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{bunchLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--chart-tons)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{tonsLabel}</span>
        </div>
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10 }} interval="preserveStartEnd" minTickGap={12} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10 }} width={35} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 12, fontSize: 12 }}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Bar dataKey="bunches" fill="var(--chart-bunches)" radius={[4, 4, 0, 0]} maxBarSize={20} />
            <Bar dataKey="tons" fill="var(--chart-tons)" radius={[4, 4, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
