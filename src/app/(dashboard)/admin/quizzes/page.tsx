"use client";

import { useState, useEffect } from "react";
import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Search, ClipboardList } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  subject: string;
  duration: number;
  total_marks: number;
  passing_marks: number;
  status: string;
  created_at: string;
  users: { name: string } | null;
  questions: { count: number }[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft: { bg: "var(--color-bg-input)", color: "var(--color-text-secondary)" },
  published: { bg: "var(--color-success-subtle)", color: "var(--color-success)" },
  archived: { bg: "var(--color-warning-subtle)", color: "var(--color-warning)" },
};

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { session } = useSession();

  useEffect(() => {
    async function fetchQuizzes() {
      if (!session) return;
      const token = await session.getToken({ template: "supabase" });
      if (!token) return;

      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data } = await sb
        .from("quizzes")
        .select("id, title, subject, duration, total_marks, passing_marks, status, created_at, users(name), questions(count)")
        .order("created_at", { ascending: false });

      if (data) setQuizzes(data as unknown as Quiz[]);
      setLoading(false);
    }
    fetchQuizzes();
  }, [session]);

  const filtered = quizzes.filter(
    (q) => !search || q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-text-heading)" }}
      >
        View Quizzes
      </h2>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-text-muted)" }}
        />
        <input
          type="text"
          placeholder="Search by title..."
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

      {/* Table */}
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
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={40} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No quizzes found.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--color-border-card)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--color-bg-card)" }}>
                  {["Title", "Subject", "Duration", "Marks", "Questions", "Status", "Created By", "Date"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border-divider)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => {
                  const statusStyle = STATUS_STYLES[q.status] || STATUS_STYLES.draft;
                  const questionCount = q.questions?.[0]?.count ?? 0;
                  return (
                    <tr
                      key={q.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--color-border-divider)" }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {q.title}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className="text-[10px] px-2 py-0.5"
                          style={{
                            backgroundColor: "var(--color-accent-amber-subtle)",
                            color: "var(--color-accent-amber)",
                            border: "1px solid var(--color-accent-amber)",
                          }}
                        >
                          {q.subject}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {q.duration} min
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {q.passing_marks}/{q.total_marks}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {questionCount}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className="text-[10px] px-2 py-0.5 capitalize"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {q.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>
                        {q.users?.name || "Unknown"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-muted)" }}>
                        {formatDate(q.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
