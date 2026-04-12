"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { formatDate, timeAgo } from "@/lib/utils";
import {
  Download,
  Bookmark,
  GraduationCap,
  FileText,
  Megaphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface StudentStats {
  downloadsCount: number;
  bookmarksCount: number;
  quizzesTaken: number;
}

interface RecentDownload {
  id: string;
  downloaded_at: string;
  materials: {
    id: string;
    title: string;
    subject: string;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

export default function StudentDashboardPage() {
  const { user } = useUser();
  const { session } = useSession();
  const [stats, setStats] = useState<StudentStats>({
    downloadsCount: 0,
    bookmarksCount: 0,
    quizzesTaken: 0,
  });
  const [recentDownloads, setRecentDownloads] = useState<RecentDownload[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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

    // Get supabase user ID
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

    // Fetch counts in parallel
    const [downloadsRes, bookmarksRes, quizzesRes, recentRes, announceRes] =
      await Promise.all([
        sb
          .from("downloads")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        sb
          .from("bookmarks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        sb
          .from("quiz_attempts")
          .select("id", { count: "exact", head: true })
          .eq("student_id", userId),
        sb
          .from("downloads")
          .select("id, downloaded_at, materials(id, title, subject)")
          .eq("user_id", userId)
          .order("downloaded_at", { ascending: false })
          .limit(5),
        sb
          .from("announcements")
          .select("id, title, content, priority, created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    setStats({
      downloadsCount: downloadsRes.count ?? 0,
      bookmarksCount: bookmarksRes.count ?? 0,
      quizzesTaken: quizzesRes.count ?? 0,
    });

    if (recentRes.data) {
      setRecentDownloads(recentRes.data as unknown as RecentDownload[]);
    }
    if (announceRes.data) {
      setAnnouncements(announceRes.data);
    }

    setLoading(false);
  }, [session, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const greeting = user?.firstName
    ? `Welcome, ${user.firstName}`
    : "Welcome";

  const STAT_CARDS = [
    {
      label: "Downloads",
      icon: Download,
      value: stats.downloadsCount,
      color: "var(--color-success)",
    },
    {
      label: "Bookmarks",
      icon: Bookmark,
      value: stats.bookmarksCount,
      color: "var(--color-accent-amber)",
    },
    {
      label: "Quizzes Taken",
      icon: GraduationCap,
      value: stats.quizzesTaken,
      color: "var(--color-info)",
    },
  ];

  const priorityColors: Record<string, string> = {
    urgent: "var(--color-danger)",
    important: "var(--color-warning)",
    normal: "var(--color-info)",
  };

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
          Browse materials, take quizzes, and track your progress.
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

      {/* Recent Downloads + Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Downloads */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-card)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-heading)",
              }}
            >
              Recent Downloads
            </h3>
            <Link
              href="/student/downloads"
              className="text-xs font-medium transition-colors hover:underline"
              style={{ color: "var(--color-accent-amber)" }}
            >
              View All
            </Link>
          </div>

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
          ) : recentDownloads.length === 0 ? (
            <div className="text-center py-8">
              <Download
                size={36}
                className="mx-auto mb-2"
                style={{ color: "var(--color-text-muted)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                No downloads yet. Browse materials to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDownloads.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 p-3 rounded-lg"
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
                      {d.materials?.title ?? "Untitled"}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {timeAgo(d.downloaded_at)}
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
                    {d.materials?.subject ?? "—"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-card)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Megaphone
              size={18}
              style={{ color: "var(--color-accent-amber)" }}
            />
            <h3
              className="text-lg font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-heading)",
              }}
            >
              Announcements
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg animate-pulse"
                  style={{ backgroundColor: "var(--color-bg-input)" }}
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone
                size={36}
                className="mx-auto mb-2"
                style={{ color: "var(--color-text-muted)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                No announcements right now.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-lg"
                  style={{
                    backgroundColor: "var(--color-bg-app)",
                    border: "1px solid var(--color-border-divider)",
                    borderLeft: `3px solid ${priorityColors[a.priority] || "var(--color-info)"}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {a.title}
                    </p>
                    {a.priority !== "normal" && (
                      <Badge
                        className="text-[9px] px-1.5 py-0"
                        style={{
                          backgroundColor: `${priorityColors[a.priority]}20`,
                          color: priorityColors[a.priority],
                          border: `1px solid ${priorityColors[a.priority]}`,
                        }}
                      >
                        {a.priority}
                      </Badge>
                    )}
                  </div>
                  <p
                    className="text-xs line-clamp-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {a.content}
                  </p>
                  <p
                    className="text-[10px] mt-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {formatDate(a.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
