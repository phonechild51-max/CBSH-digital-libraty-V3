import { createServerClient } from "@/lib/supabase/server";
import { AdminDashboardClient } from "./client";

export default async function AdminDashboardPage() {
  const supabase = createServerClient();

  // Fetch stats via RPC
  const { data: stats } = await supabase.rpc("get_admin_dashboard_stats");

  // Fetch top 5 pending users
  const { data: pendingUsers } = await supabase
    .from("users")
    .select("id, name, email, role, created_at, insforge_uid")
    .in("status", ["pending", "email_verified"])
    .order("created_at", { ascending: false })
    .limit(5);

  // Fallback map if the stats RPC doesn't provide users_by_role natively
  let usersByRole = stats?.users_by_role;
  if (!usersByRole) {
    const { data: usersData } = await supabase.from("users").select("role");
    if (usersData) {
      const counts: Record<string, number> = {};
      for (const u of usersData) {
        const r = u.role || "unknown";
        counts[r] = (counts[r] || 0) + 1;
      }
      usersByRole = Object.entries(counts).map(([role, count]) => ({ role, count }));
    } else {
      usersByRole = [];
    }
  }

  return (
    <AdminDashboardClient
      stats={{ ...stats, users_by_role: usersByRole }}
      pendingUsers={pendingUsers || []}
    />
  );
}
