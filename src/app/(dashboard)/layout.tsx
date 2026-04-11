"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { createBrowserClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/constants";

// Map pathname segment to a page title
function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "Dashboard";
  // Capitalize and replace hyphens
  return last
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [supabaseUserId, setSupabaseUserId] = useState<string | undefined>();

  const role = (user?.publicMetadata?.role as UserRole) || "student";
  const title = getPageTitle(pathname);

  // Lookup the Supabase user ID for notifications
  useEffect(() => {
    if (!user?.id) return;

    const supabase = createBrowserClient();
    supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setSupabaseUserId(data.id);
      });
  }, [user?.id]);

  // Fetch pending user count for admin badge
  useEffect(() => {
    if (role !== "admin") return;

    const supabase = createBrowserClient();
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count }) => {
        setPendingCount(count ?? 0);
      });
  }, [role]);

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-app)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 border-3 rounded-full animate-spin"
            style={{
              borderColor: "var(--color-border-divider)",
              borderTopColor: "var(--color-accent-amber)",
            }}
          />
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="min-h-screen flex"
        style={{ backgroundColor: "var(--color-bg-app)" }}
      >
        {/* Sidebar */}
        <Sidebar
          role={role}
          pendingCount={pendingCount}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <Topbar
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
            supabaseUserId={supabaseUserId}
            role={role}
          />

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
