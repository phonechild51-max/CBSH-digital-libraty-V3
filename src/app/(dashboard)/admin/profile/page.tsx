import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { createServerClient } from "@/lib/supabase/server";
import { Users, GraduationCap, ClipboardList, BookOpen } from "lucide-react";

export default async function AdminProfilePage() {
  const sb = createServerClient();
  
  let stats = {
    total_users: 0,
    students: 0,
    teachers: 0,
    materials: 0
  };

  try {
    const { data: adminStats } = await sb.rpc("get_admin_dashboard_stats");
    
    // Also fetch roles specific to verify our numbers, or count them directly if RPC doesn't have it
    const [studentsRes, teachersRes, materialsRes] = await Promise.all([
      sb.from("users").select("id", { count: "exact" }).eq("role", "student"),
      sb.from("users").select("id", { count: "exact" }).eq("role", "teacher"),
      sb.from("materials").select("id", { count: "exact" }),
    ]);

    stats = {
      total_users: (adminStats as any)?.total_users || 0,
      students: studentsRes.count || 0,
      teachers: teachersRes.count || 0,
      materials: materialsRes.count || 0
    };
  } catch (err) {
    console.error("Error fetching admin stats for profile", err);
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          Admin Profile
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Manage your administrator account and overview system health.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: stats.total_users,
            icon: Users,
          },
          {
            label: "Students",
            value: stats.students,
            icon: GraduationCap,
          },
          {
            label: "Teachers",
            value: stats.teachers,
            icon: ClipboardList,
          },
          {
            label: "Materials",
            value: stats.materials,
            icon: BookOpen,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-4 rounded-xl flex items-center justify-between"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <div>
              <p
                className="text-xs uppercase tracking-wider font-semibold mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {stat.label}
              </p>
              <p
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-primary)",
                }}
              >
                {stat.value}
              </p>
            </div>
            <div
              className="p-3 rounded-xl flex-shrink-0"
              style={{
                backgroundColor: "var(--color-accent-amber-glow)",
                color: "var(--color-accent-amber)",
              }}
            >
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <UserProfile 
          routing="hash"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#D97706",
              colorBackground: "#18181b",
              colorInputBackground: "#27272a",
              colorInputText: "#f4f4f5",
            }
          }}
        />
      </div>
    </div>
  );
}
