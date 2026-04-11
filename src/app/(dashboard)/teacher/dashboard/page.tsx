"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { formatDate } from "@/lib/utils";
import {
  FolderOpen,
  BarChart3,
  PenSquare,
  FileText,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecentMaterial {
  id: string;
  title: string;
  subject: string;
  upload_date: string;
  download_count: number;
}

interface TeacherStats {
  materialsCount: number;
  quizzesCount: number;
  totalDownloads: number;
}

export default function TeacherDashboardPage() {
  const { user } = useUser();
  const { session } = useSession();
  const [stats, setStats] = useState<TeacherStats>({
    materialsCount: 0,
    quizzesCount: 0,
    totalDownloads: 0,
  });
  const [recentMaterials, setRecentMaterials] = useState<RecentMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session || !user) return;
    const token = await session.getToken({ template: "supabase" });
    if (!token) return;

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Get the teacher's supabase user ID
    const { data: userData } = await sb
      .from("users")
      .select("id")
      .eq("insforge_uid", user.id)
      .single();

    if (!userData) {
      setLoading(false);
      return;
    }

    const userId = userData.id;

    // Fetch materials with stats
    const { data: materials } = await sb
      .from("materials")
      .select("id, title, subject, upload_date, download_count")
      .eq("uploaded_by", userId)
      .order("upload_date", { ascending: false });

    // Fetch quizzes count
    const { count: quizzesCount } = await sb
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .eq("created_by", userId);

    if (materials) {
      const totalDownloads = materials.reduce(
        (sum, m) => sum + (m.download_count || 0),
        0
      );
      setStats({
        materialsCount: materials.length,
        quizzesCount: quizzesCount ?? 0,
        totalDownloads,
      });
      setRecentMaterials(materials.slice(0, 5));
    }

    setLoading(false);
  }, [session, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const greeting = user?.firstName
    ? `Welcome back, ${user.firstName}`
    : "Welcome back";

  const STAT_CARDS = [
    {
      label: "My Materials",
      icon: FolderOpen,
      value: stats.materialsCount,
      color: "var(--color-info)",
    },
    {
      label: "Total Downloads",
      icon: BarChart3,
      value: stats.totalDownloads,
      color: "var(--color-success)",
    },
    {
      label: "My Quizzes",
      icon: PenSquare,
      value: stats.quizzesCount,
      color: "var(--color-warning)",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Greeting */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          {greeting}
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Manage your materials and quizzes.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
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
                {card.label}
              </p>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <card.icon size={20} style={{ color: card.color }} />
              </div>
            </div>
            <p
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-heading)",
              }}
            >
              {loading ? (
                <span
                  className="inline-block w-12 h-8 rounded animate-pulse"
                  style={{ backgroundColor: "var(--color-bg-input)" }}
                />
              ) : (
                card.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Materials */}
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
          Recent Uploads
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg animate-pulse"
                style={{ backgroundColor: "var(--color-bg-input)" }}
              />
            ))}
          </div>
        ) : recentMaterials.length === 0 ? (
          <div className="text-center py-8">
            <FileText
              size={36}
              className="mx-auto mb-2"
              style={{ color: "var(--color-text-muted)" }}
            />
            <p
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              No materials uploaded yet. Start by uploading your first material.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentMaterials.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--color-bg-app)",
                  border: "1px solid var(--color-border-divider)",
                }}
              >
                <FileText
                  size={16}
                  style={{ color: "var(--color-accent-amber)" }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {m.title}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {formatDate(m.upload_date)}
                  </p>
                </div>
                <Badge
                  className="text-[10px] px-2 py-0.5"
                  style={{
                    backgroundColor: "var(--color-accent-amber-subtle)",
                    color: "var(--color-accent-amber)",
                    border: "1px solid var(--color-accent-amber)",
                  }}
                >
                  {m.subject}
                </Badge>
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <Download size={12} />
                  {m.download_count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
