"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RoleData {
  role: string;
  count: number;
}

const COLORS = [
  "#3B82F6", // blue - Student
  "#2DD4BF", // teal - Teacher
  "#D4922A", // amber - Admin
  "#A78BFA", // violet - unknown
  "#F472B6", // pink
];

interface RolePieChartProps {
  data: RoleData[];
}

export function RolePieChart({ data }: RolePieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          No users found.
        </p>
      </div>
    );
  }

  // Map roles to colors consistently if possible
  const getColor = (role: string, index: number) => {
    switch (role.toLowerCase()) {
      case "student": return COLORS[0];
      case "teacher": return COLORS[1];
      case "admin": return COLORS[2];
      default: return COLORS[index % COLORS.length];
    }
  };

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
              nameKey="role"
              strokeWidth={2}
              stroke="var(--color-bg-card)"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.role, i)} />
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
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              formatter={(value: any) => [`${value ?? 0} registered`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {data.map((item, i) => (
          <div key={item.role} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: getColor(item.role, i) }}
            />
            <span
              className="text-sm capitalize"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {item.role || "Unknown"}
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
