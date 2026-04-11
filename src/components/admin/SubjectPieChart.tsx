"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SubjectData {
  subject: string;
  count: number;
}

const COLORS = [
  "#D4922A", // amber
  "#2DD4BF", // teal
  "#3B82F6", // blue
  "#A78BFA", // violet
  "#F472B6", // pink
  "#34D399", // emerald
  "#FBBF24", // yellow
  "#F87171", // red
  "#60A5FA", // light blue
  "#818CF8", // indigo
  "#E879F9", // fuchsia
  "#FB923C", // orange
];

interface SubjectPieChartProps {
  data: SubjectData[];
}

export function SubjectPieChart({ data }: SubjectPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No materials uploaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Chart */}
      <div className="w-64 h-64 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="count"
              nameKey="subject"
              strokeWidth={2}
              stroke="var(--color-bg-card)"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border-card)",
                borderRadius: "8px",
                color: "var(--color-text-primary)",
                fontSize: "13px",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [`${value} materials`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {data.map((item, i) => (
          <div key={item.subject} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {item.subject}
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: "var(--color-text-muted)" }}
            >
              ({item.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
