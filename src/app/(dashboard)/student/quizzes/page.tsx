"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { formatDate } from "@/lib/utils";
import {
  GraduationCap,
  Clock,
  Target,
  Award,
  CheckCircle2,
  Play,
  History,
  Trophy,
  XCircle,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Quiz {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  duration: number;
  passing_marks: number;
  total_marks: number;
  created_at: string;
}

interface AttemptInfo {
  quiz_id: string;
  score: number;
  total_marks: number;
  percentage: number;
  status: string;
}

interface HistoryAttempt {
  id: string;
  score: number;
  total_marks: number;
  percentage: number;
  status: string;
  time_taken: number | null;
  attempt_date: string;
  quiz_id: string;
  quizzes: {
    title: string;
    subject: string;
  };
}

type Tab = "available" | "history";

export default function AvailableQuizzesPage() {
  const { user } = useUser();
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("available");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Record<string, AttemptInfo>>({});
  const [history, setHistory] = useState<HistoryAttempt[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const tokenRef = useRef<string | null>(null);
  const sbRef = useRef<ReturnType<typeof createClient> | null>(null);

  const getClient = useCallback(async () => {
    if (!session) return null;
    const token = await session.getToken({ template: "supabase" });
    if (!token) return null;
    if (token !== tokenRef.current || !sbRef.current) {
      tokenRef.current = token;
      sbRef.current = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
    }
    return sbRef.current;
  }, [session]);

  const fetchData = useCallback(async () => {
    if (!session || !user) return;
    const sb = await getClient();
    if (!sb) return;

    const { data: userRaw } = await sb
      .from("users")
      .select("id")
      .eq("insforge_uid", user.id)
      .single();

    if (!userRaw) {
      setLoading(false);
      return;
    }
    const userData = userRaw as { id: string };

    const [quizzesRes, attemptsRes] = await Promise.all([
      sb
        .from("quizzes")
        .select(
          "id, title, subject, description, duration, passing_marks, total_marks, created_at"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false }),
      sb
        .from("quiz_attempts")
        .select("quiz_id, score, total_marks, percentage, status")
        .eq("student_id", userData.id),
    ]);

    if (quizzesRes.data) setQuizzes(quizzesRes.data as Quiz[]);
    if (attemptsRes.data) {
      const map: Record<string, AttemptInfo> = {};
      (attemptsRes.data as AttemptInfo[]).forEach((a) => {
        map[a.quiz_id] = a;
      });
      setAttempts(map);
    }

    setLoading(false);
  }, [session, user, getClient]);

  const fetchHistory = useCallback(async () => {
    if (!session || !user || historyLoaded) return;
    const sb = await getClient();
    if (!sb) return;

    const { data: userData } = await sb
      .from("users")
      .select("id")
      .eq("insforge_uid", user.id)
      .single();

    if (!userData) return;
    const studentId = (userData as { id: string }).id;

    const { data } = await sb
      .from("quiz_attempts")
      .select(
        "id, score, total_marks, percentage, status, time_taken, attempt_date, quiz_id, quizzes(title, subject)"
      )
      .eq("student_id", studentId)
      .order("attempt_date", { ascending: false });

    if (data) {
      setHistory(data as unknown as HistoryAttempt[]);
      setHistoryLoaded(true);
    }
  }, [session, user, getClient, historyLoaded]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab, fetchHistory]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text-heading)" }}
        >
          Quizzes
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          Test your knowledge or review your past attempts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border-card)" }}>
        {(["available", "history"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: activeTab === tab ? "var(--color-accent-amber)" : "transparent",
              color: activeTab === tab ? "#000" : "var(--color-text-secondary)",
            }}
          >
            {tab === "available" ? <GraduationCap size={15} /> : <History size={15} />}
            {tab === "available" ? "Available" : "My History"}
          </button>
        ))}
      </div>

      {/* ── Available Quizzes Tab ───────────────────────────────────────────── */}
      {activeTab === "available" && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-bg-card)" }} />
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border-card)" }}>
              <GraduationCap size={48} className="mx-auto mb-4" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-heading)" }}>
                No quizzes available
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Check back later — your teachers will publish quizzes soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => {
                const attempt = attempts[quiz.id];
                const isAttempted = !!attempt;

                return (
                  <div
                    key={quiz.id}
                    className="rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      backgroundColor: "var(--color-bg-card)",
                      border: `1px solid ${isAttempted ? (attempt.status === "pass" ? "var(--color-success)" : "var(--color-danger)") : "var(--color-border-card)"}`,
                    }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge
                          className="text-[10px] px-2 py-0.5"
                          style={{ backgroundColor: "var(--color-accent-amber-subtle)", color: "var(--color-accent-amber)", border: "1px solid var(--color-accent-amber)" }}
                        >
                          {quiz.subject}
                        </Badge>
                        {isAttempted && (
                          <Badge
                            className="text-[10px] px-2 py-0.5 flex items-center gap-1"
                            style={{
                              backgroundColor: attempt.status === "pass" ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
                              color: attempt.status === "pass" ? "var(--color-success)" : "var(--color-danger)",
                              border: `1px solid ${attempt.status === "pass" ? "var(--color-success)" : "var(--color-danger)"}`,
                            }}
                          >
                            <CheckCircle2 size={10} />
                            {attempt.status === "pass" ? "Passed" : "Failed"}
                          </Badge>
                        )}
                      </div>

                      <h3
                        className="text-base font-semibold mb-2 line-clamp-2"
                        style={{ fontFamily: "var(--font-display)", color: "var(--color-text-heading)", minHeight: "2.5em" }}
                      >
                        {quiz.title}
                      </h3>

                      {quiz.description && (
                        <p className="text-xs line-clamp-2 mb-3" style={{ color: "var(--color-text-muted)" }}>
                          {quiz.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} style={{ color: "var(--color-text-muted)" }} />
                          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{quiz.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target size={13} style={{ color: "var(--color-text-muted)" }} />
                          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{quiz.total_marks} marks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award size={13} style={{ color: "var(--color-text-muted)" }} />
                          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Pass: {quiz.passing_marks}</span>
                        </div>
                      </div>

                      {isAttempted ? (
                        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "var(--color-bg-app)", border: "1px solid var(--color-border-divider)" }}>
                          <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Your Score</p>
                          <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: attempt.status === "pass" ? "var(--color-success)" : "var(--color-danger)" }}>
                            {attempt.score}/{attempt.total_marks}{" "}
                            <span className="text-xs font-normal">({attempt.percentage}%)</span>
                          </p>
                        </div>
                      ) : (
                        <Link
                          href={`/student/take-quiz/${quiz.id}`}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                          style={{ backgroundColor: "var(--color-accent-amber)", color: "#000" }}
                        >
                          <Play size={16} />
                          Start Quiz
                        </Link>
                      )}
                    </div>

                    <div className="px-5 py-2.5" style={{ borderTop: "1px solid var(--color-border-divider)" }}>
                      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                        Published {formatDate(quiz.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── My History Tab ─────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <>
          {!historyLoaded ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: "var(--color-bg-card)" }} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={{ backgroundColor: "var(--color-bg-card)", border: "1px solid var(--color-border-card)" }}>
              <History size={48} className="mx-auto mb-4" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-heading)" }}>
                No quiz attempts yet
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Complete a quiz to see your history here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((attempt) => {
                const isPassed = attempt.status === "pass";
                return (
                  <div
                    key={attempt.id}
                    className="rounded-xl p-5 flex items-center gap-4 transition-all hover:scale-[1.005]"
                    style={{
                      backgroundColor: "var(--color-bg-card)",
                      border: `1px solid ${isPassed ? "var(--color-success)" : "var(--color-danger)"}`,
                    }}
                  >
                    {/* Pass/fail icon */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isPassed ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
                      }}
                    >
                      {isPassed
                        ? <Trophy size={20} style={{ color: "var(--color-success)" }} />
                        : <XCircle size={20} style={{ color: "var(--color-danger)" }} />
                      }
                    </div>

                    {/* Quiz info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-heading)", fontFamily: "var(--font-display)" }}>
                        {attempt.quizzes?.title ?? "—"}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {attempt.quizzes?.subject}
                        </span>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {formatDate(attempt.attempt_date)}
                        </span>
                        {attempt.time_taken && (
                          <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                            <Clock size={11} /> {formatTime(attempt.time_taken)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-lg font-bold"
                        style={{ fontFamily: "var(--font-mono)", color: isPassed ? "var(--color-success)" : "var(--color-danger)" }}
                      >
                        {attempt.score}/{attempt.total_marks}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {attempt.percentage}%
                      </p>
                    </div>

                    {/* Review button */}
                    <Link
                      href={`/student/quiz-review/${attempt.id}?quiz_id=${attempt.quiz_id}`}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{
                        backgroundColor: "var(--color-bg-app)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border-card)",
                      }}
                    >
                      <Eye size={13} />
                      Review
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
