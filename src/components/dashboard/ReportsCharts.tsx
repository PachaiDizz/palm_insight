"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ReportsChartsProps {
  chartData: { date: string; bunches: number; tons: number }[];
  pieData: { name: string; value: number; color: string }[];
  totalDays: number;
  workDays: number;
  noWorkDays: number;
}

export default function ReportsCharts({ chartData, pieData, totalDays, workDays, noWorkDays }: ReportsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="lg:col-span-2 card-glow rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)" }}>
        <h3 className="card-title text-sm text-theme mb-4">Daily Production</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tick={{ fill: "var(--chart-axis)", fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} interval="preserveStartEnd" minTickGap={20} />
              <YAxis tick={{ fill: "var(--chart-axis)", fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: "12px" }} />
              <Bar dataKey="bunches" fill="var(--chart-bunches)" name="Bunches" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tons" fill="var(--chart-tons)" name="Tons" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data for this period</p>
          </div>
        )}
      </div>
      <div className="card-glow rounded-2xl p-5" style={{ backgroundColor: "var(--bg-card)" }}>
        <h3 className="card-title text-sm text-theme mb-4">Work Status</h3>
        {totalDays > 0 ? (
          <div className="relative" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-theme">{totalDays}</span>
              <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Total Days</span>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No data</p>
          </div>
        )}
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--status-work)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Work ({workDays})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--status-no-work)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>No Work ({noWorkDays})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
