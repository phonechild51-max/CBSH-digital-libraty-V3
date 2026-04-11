import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: string;
}

export function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: "var(--color-bg-card)",
        border: "1px solid var(--color-border-card)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </p>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <p
        className="text-3xl font-bold"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--color-text-heading)",
        }}
      >
        {value}
      </p>
      {trend && (
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
          {trend}
        </p>
      )}
    </div>
  );
}
