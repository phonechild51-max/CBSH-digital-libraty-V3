"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { updateQuizStatus, deleteQuiz } from "./actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Trash2,
  Archive,
  Send,
  RotateCcw,
  Clock,
  HelpCircle,
} from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  subject: string;
  duration: number;
  total_marks: number;
  passing_marks: number;
  status: string;
  created_at: string;
  questions: { count: number }[];
}

type TabFilter = "all" | "published" | "draft" | "archived";

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  published: {
    bg: "var(--color-success-subtle)",
    color: "var(--color-success)",
    border: "1px solid var(--color-success)",
  },
  draft: {
    bg: "var(--color-warning-subtle)",
    color: "var(--color-warning)",
    border: "1px solid var(--color-warning)",
  },
  archived: {
    bg: "var(--color-bg-input)",
    color: "var(--color-text-muted)",
    border: "1px solid var(--color-border-input)",
  },
};

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("all");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [isPending, startTransition] = useTransition();
  const { session } = useSession();
  const { user } = useUser();

  const fetchQuizzes = useCallback(async () => {
    if (!session || !user) return;
    const token = await session.getToken({ template: "supabase" });
    if (!token) return;

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: userData } = await sb
      .from("users")
      .select("id")
      .eq("insforge_uid", user.id)
      .single();

    if (!userData) {
      setLoading(false);
      return;
    }

    const { data } = await sb
      .from("quizzes")
      .select(
        "id, title, subject, duration, total_marks, passing_marks, status, created_at, questions(count)"
      )
      .eq("created_by", userData.id)
      .order("created_at", { ascending: false });

    if (data) setQuizzes(data as Quiz[]);
    setLoading(false);
  }, [session, user]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const filtered = quizzes.filter((q) => {
    const matchSearch =
      !search || q.title.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || q.status === tab;
    return matchSearch && matchTab;
  });

  const toggleStatus = (quiz: Quiz, newStatus: "published" | "archived" | "draft") => {
    startTransition(async () => {
      await updateQuizStatus(quiz.id, newStatus);
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? { ...q, status: newStatus } : q))
      );
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      await deleteQuiz(target.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== target.id));
      setDeleteTarget(null);
    });
  };

  const TABS: { label: string; value: TabFilter }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Drafts", value: "draft" },
    { label: "Archived", value: "archived" },
  ];

  const inputStyle = {
    backgroundColor: "var(--color-bg-input)",
    border: "1px solid var(--color-border-input)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          My Quizzes
        </h2>
        <Badge
          className="text-xs px-2.5 py-1"
          style={{
            backgroundColor: "var(--color-accent-amber-subtle)",
            color: "var(--color-accent-amber)",
            border: "1px solid var(--color-accent-amber)",
          }}
        >
          {quizzes.length} total
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--color-bg-card)" }}>
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
            style={{
              backgroundColor:
                tab === t.value ? "var(--color-accent-amber)" : "transparent",
              color: tab === t.value ? "#000" : "var(--color-text-secondary)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-text-muted)" }}
        />
        <input
          type="text"
          placeholder="Search quizzes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
          style={inputStyle}
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
          <HelpCircle
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {search || tab !== "all"
              ? "No quizzes match your filter."
              : "You haven't created any quizzes yet."}
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
                  {[
                    "Title",
                    "Subject",
                    "Duration",
                    "Marks",
                    "Questions",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                      style={{
                        color: "var(--color-text-muted)",
                        borderBottom: "1px solid var(--color-border-divider)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => {
                  const questionCount = q.questions?.[0]?.count ?? 0;
                  const style =
                    STATUS_STYLES[q.status] || STATUS_STYLES.draft;

                  return (
                    <tr
                      key={q.id}
                      className="transition-colors"
                      style={{
                        borderBottom: "1px solid var(--color-border-divider)",
                      }}
                    >
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {q.title}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className="text-[10px] px-2 py-0.5"
                          style={{
                            backgroundColor:
                              "var(--color-accent-amber-subtle)",
                            color: "var(--color-accent-amber)",
                            border: "1px solid var(--color-accent-amber)",
                          }}
                        >
                          {q.subject}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          <Clock size={12} />
                          {q.duration} min
                        </span>
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{
                          color: "var(--color-text-secondary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {q.total_marks} ({q.passing_marks} pass)
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{
                          color: "var(--color-text-secondary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {questionCount}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className="text-[10px] px-2 py-0.5 capitalize"
                          style={{
                            backgroundColor: style.bg,
                            color: style.color,
                            border: style.border,
                          }}
                        >
                          {q.status}
                        </Badge>
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {formatDate(q.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {q.status === "draft" && (
                            <button
                              onClick={() => toggleStatus(q, "published")}
                              disabled={isPending}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-success-subtle)]"
                              style={{ color: "var(--color-success)" }}
                              title="Publish"
                            >
                              <Send size={14} />
                            </button>
                          )}
                          {q.status === "published" && (
                            <button
                              onClick={() => toggleStatus(q, "archived")}
                              disabled={isPending}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-warning-subtle)]"
                              style={{ color: "var(--color-warning)" }}
                              title="Archive"
                            >
                              <Archive size={14} />
                            </button>
                          )}
                          {q.status === "archived" && (
                            <button
                              onClick={() => toggleStatus(q, "draft")}
                              disabled={isPending}
                              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-info-subtle)]"
                              style={{ color: "var(--color-info)" }}
                              title="Restore to Draft"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(q)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-danger-subtle)]"
                            style={{ color: "var(--color-danger)" }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Quiz"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? All questions will also be removed. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
