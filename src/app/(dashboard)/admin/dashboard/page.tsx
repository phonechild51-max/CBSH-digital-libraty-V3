import { createServerClient } from "@/lib/supabase/server";
import { AdminDashboardClient } from "./client";

export default async function AdminDashboardPage() {
  const supabase = createServerClient();

  // Fetch stats via RPC
  const { data: stats } = await supabase.rpc("get_admin_dashboard_stats");

  // Fetch top 5 pending users
  const { data: pendingUsers } = await supabase
    .from("users")
    .select("id, full_name, email, role, created_at, clerk_id")
    .in("status", ["pending", "email_verified"])
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <AdminDashboardClient
      stats={stats || {}}
      pendingUsers={pendingUsers || []}
    />
  );
}
