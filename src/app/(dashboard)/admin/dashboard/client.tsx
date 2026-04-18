"use client";

import { Users, FileText, ClipboardList, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { SubjectPieChart } from "@/components/admin/SubjectPieChart";
import { RolePieChart } from "@/components/admin/RolePieChart";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  insforge_uid: string;
}

interface DashboardStats {
  total_users?: number;
  total_materials?: number;
  total_quizzes?: number;
  pending_users?: number;
  pass_rate?: number;
  materials_by_subject?: { subject: string; count: number }[];
  users_by_role?: { role: string; count: number }[];
}

interface AdminDashboardClientProps {
  stats: DashboardStats;
  pendingUsers: PendingUser[];
}

export function AdminDashboardClient({ stats, pendingUsers }: AdminDashboardClientProps) {
  const passRateColor =
    (stats.pass_rate ?? 0) >= 70
      ? "var(--color-success)"
      : (stats.pass_rate ?? 0) >= 40
        ? "var(--color-warning)"
        : "var(--color-danger)";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          Dashboard
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Overview of your digital library.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats.total_users ?? 0}
          icon={Users}
          color="var(--color-accent-amber)"
        />
        <StatCard
          label="Total Materials"
          value={stats.total_materials ?? 0}
          icon={FileText}
          color="var(--color-info)"
        />
        <StatCard
          label="Published Quizzes"
          value={stats.total_quizzes ?? 0}
          icon={ClipboardList}
          color="var(--color-success)"
        />
        <StatCard
          label="Pass Rate"
          value={`${stats.pass_rate ?? 0}%`}
          icon={TrendingUp}
          color={passRateColor}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Materials by Subject */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-card)",
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            Materials by Subject
          </h3>
          <SubjectPieChart data={stats.materials_by_subject || []} />
        </div>

        {/* Users by Role */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-card)",
          }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            Users by Role
          </h3>
          <RolePieChart data={stats.users_by_role || []} />
        </div>
      </div>

      {/* Pending Approvals */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <h3
            className="text-lg font-semibold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            Pending Approvals
          </h3>
          {(stats.pending_users ?? 0) > 0 && (
            <Badge
              variant="destructive"
              className="text-xs px-2 py-0.5 rounded-full"
            >
              {stats.pending_users}
            </Badge>
          )}
        </div>

        {pendingUsers.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No pending approvals.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-3 rounded-lg"
                style={{
                  backgroundColor: "var(--color-bg-app)",
                  border: "1px solid var(--color-border-divider)",
                }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: "var(--color-accent-amber-glow)",
                    color: "var(--color-accent-amber)",
                    border: "1px solid var(--color-accent-amber)",
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {user.name}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {user.email}
                  </p>
                </div>

                {/* Role */}
                <Badge
                  className="text-[10px] px-2 py-0.5"
                  style={{
                    backgroundColor: "var(--color-bg-input)",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border-card)",
                  }}
                >
                  {user.role}
                </Badge>

                {/* Date */}
                <span
                  className="text-xs hidden sm:block"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {formatDate(user.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
