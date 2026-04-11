"use client";

import { useState, useEffect, useTransition } from "react";
import { approveUser, denyUser } from "./actions";

import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Search, UserCheck, UserX, Clock } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  clerk_id: string;
}

type TabKey = "pending" | "approved" | "denied";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "approved", label: "Approved", icon: UserCheck },
  { key: "denied", label: "Denied", icon: UserX },
];

export default function ApproveUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<TabKey>("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { session } = useSession();

  // Fetch users with Clerk JWT for RLS
  useEffect(() => {
    async function fetchUsers() {
      if (!session) return;
      const token = await session.getToken({ template: "supabase" });
      if (!token) return;

      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data } = await sb
        .from("users")
        .select("id, full_name, email, role, status, created_at, clerk_id")
        .order("created_at", { ascending: false });

      if (data) setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, [session]);

  const filteredUsers = users.filter((u) => {
    const matchTab =
      tab === "pending"
        ? u.status === "pending" || u.status === "email_verified"
        : u.status === tab;
    const matchSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const pendingCount = users.filter(
    (u) => u.status === "pending" || u.status === "email_verified"
  ).length;

  const handleApprove = (user: User) => {
    setActioningId(user.id);
    startTransition(async () => {
      try {
        await approveUser(user.id, user.clerk_id, user.role as "teacher" | "student");
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: "approved" } : u))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setActioningId(null);
      }
    });
  };

  const handleDeny = (user: User) => {
    setActioningId(user.id);
    startTransition(async () => {
      try {
        await denyUser(user.id);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: "denied" } : u))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setActioningId(null);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          Approve Users
        </h2>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-xs px-2 py-0.5 rounded-full">
            {pendingCount}
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t.key ? "var(--color-accent-amber-glow)" : "transparent",
              color: tab === t.key ? "var(--color-accent-amber)" : "var(--color-text-secondary)",
              borderBottom: tab === t.key ? "2px solid var(--color-accent-amber)" : "2px solid transparent",
            }}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-text-muted)" }}
        />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          style={{
            backgroundColor: "var(--color-bg-input)",
            border: "1px solid var(--color-border-input)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin"
            style={{
              borderColor: "var(--color-border-divider)",
              borderTopColor: "var(--color-accent-amber)",
            }}
          />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck size={40} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No {tab} users found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-4 rounded-xl transition-colors"
              style={{
                backgroundColor: "var(--color-bg-card)",
                border: "1px solid var(--color-border-card)",
              }}
            >
              {/* Avatar */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  backgroundColor: "var(--color-accent-amber-glow)",
                  color: "var(--color-accent-amber)",
                  border: "1px solid var(--color-accent-amber)",
                }}
              >
                {user.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                  {user.full_name}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                  {user.email}
                </p>
              </div>

              {/* Role */}
              <Badge
                className="text-[10px] px-2 py-0.5 hidden sm:inline-flex"
                style={{
                  backgroundColor: "var(--color-bg-input)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-card)",
                }}
              >
                {user.role}
              </Badge>

              {/* Date */}
              <span className="text-xs hidden md:block" style={{ color: "var(--color-text-muted)" }}>
                {formatDate(user.created_at)}
              </span>

              {/* Actions / Status */}
              {user.status === "approved" ? (
                <Badge
                  className="text-xs px-2 py-1"
                  style={{ backgroundColor: "var(--color-success-subtle)", color: "var(--color-success)" }}
                >
                  Approved
                </Badge>
              ) : user.status === "denied" ? (
                <Badge
                  className="text-xs px-2 py-1"
                  style={{ backgroundColor: "var(--color-danger-subtle)", color: "var(--color-danger)" }}
                >
                  Denied
                </Badge>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(user)}
                    disabled={actioningId === user.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-success)", color: "#fff" }}
                  >
                    {actioningId === user.id ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleDeny(user)}
                    disabled={actioningId === user.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--color-danger)",
                      border: "1px solid var(--color-danger)",
                    }}
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
