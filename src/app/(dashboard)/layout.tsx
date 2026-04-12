"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk, useSession } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/constants";
import { healUserSyncAction } from "./heal";

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
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [supabaseUserId, setSupabaseUserId] = useState<string | undefined>();
  const [userStatus, setUserStatus] = useState<string | null>(null);

  const role = (user?.publicMetadata?.role as UserRole) || "student";
  const title = getPageTitle(pathname);

  const { session } = useSession();

  // Lookup the Supabase user ID for notifications and check status
  useEffect(() => {
    if (!user?.id || !session) return;

    const checkStatus = async () => {
      const token = await session.getToken({ template: "supabase" });
      if (!token) {
        setUserStatus("pending");
        return;
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data } = await supabase
        .from("users")
        .select("id, status")
        .eq("insforge_uid", user.id)
        .single();

      if (data) {
        setSupabaseUserId(data.id);
        setUserStatus(data.status);
      } else {
        // Mismatch detected: Clerk has user with role, but Supabase doesn't.
        // This usually happens if the DB is wiped but Clerk users are kept, or webhook failed.
        const healResult = await healUserSyncAction();
        if (healResult.success) {
          setUserStatus(healResult.status);
          
          // Re-fetch to get the newly created database ID
          const { data: newData } = await supabase
            .from("users")
            .select("id")
            .eq("insforge_uid", user.id)
            .single();
            
          if (newData) {
            setSupabaseUserId(newData.id);
          }
        } else {
          setUserStatus("pending");
        }
      }
    };

    checkStatus();
  }, [user?.id, session]);

  // Fetch pending user count for admin badge
  useEffect(() => {
    if (role !== "admin" || !session) return;

    const fetchPendingCount = async () => {
      const token = await session.getToken({ template: "supabase" });
      if (!token) return;

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      setPendingCount(count ?? 0);
    };

    fetchPendingCount();
  }, [role, session]);

  if (!isLoaded || (user?.id && !userStatus)) {
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

  if (userStatus === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in" style={{ backgroundColor: "var(--color-bg-app)" }}>
        <div className="max-w-md w-full text-center p-10 rounded-3xl border shadow-2xl" style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border-card)" }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: "var(--color-danger-subtle)", border: "1px solid var(--color-danger)" }}>
            <svg className="w-10 h-10" style={{ color: "var(--color-danger)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text-heading)", fontFamily: "var(--font-display)" }}>Access Denied</h2>
          <p className="mb-8 leading-relaxed text-lg" style={{ color: "var(--color-text-secondary)" }}>
            Your account request has been reviewed and denied by an administrator. You do not have access to this portal.
          </p>
          <button 
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            className="w-full text-center py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:bg-opacity-80"
            style={{ 
              backgroundColor: "var(--color-bg-primary)", 
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-divider)"
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (userStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in" style={{ backgroundColor: "var(--color-bg-app)" }}>
        <div className="max-w-md w-full text-center p-10 rounded-3xl border shadow-2xl" style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border-card)" }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: "var(--color-accent-amber-glow)", border: "1px solid var(--color-accent-amber)" }}>
            <svg className="w-10 h-10" style={{ color: "var(--color-accent-amber)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text-heading)", fontFamily: "var(--font-display)" }}>Approval Pending</h2>
          <p className="mb-6 leading-relaxed text-lg" style={{ color: "var(--color-text-secondary)" }}>
            Your account is currently waiting for administrator approval. Please check back later.
          </p>
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--color-accent-amber)", animationDelay: "0ms" }}></div>
            <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--color-accent-amber)", animationDelay: "150ms" }}></div>
            <div className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: "var(--color-accent-amber)", animationDelay: "300ms" }}></div>
          </div>
          <button 
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            className="w-full text-center py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:bg-opacity-80"
            style={{ 
              backgroundColor: "var(--color-bg-primary)", 
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-divider)"
            }}
          >
            Sign out
          </button>
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
