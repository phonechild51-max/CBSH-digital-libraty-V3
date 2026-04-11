"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function AvailableQuizzesPage() {
  const { user } = useUser();
  const { session } = useSession();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Record<string, AttemptInfo>>({});
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

    // Get user ID
    const { data: userData } = await sb
      .from("users")
      .select("id")
      .eq("insforge_uid", user.id)
      .single();

    if (!userData) {
      setLoading(false);
      return;
    }

    // Fetch published quizzes and student's attempts in parallel
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

    if (quizzesRes.data) setQuizzes(quizzesRes.data);
    if (attemptsRes.data) {
      const map: Record<string, AttemptInfo> = {};
      attemptsRes.data.forEach((a) => {
        map[a.quiz_id] = a;
      });
      setAttempts(map);
    }

    setLoading(false);
  }, [session, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          Available Quizzes
        </h2>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Test your knowledge with quizzes created by your teachers.
        </p>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 rounded-xl animate-pulse"
              style={{ backgroundColor: "var(--color-bg-card)" }}
            />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-card)",
          }}
        >
          <GraduationCap
            size={48}
            className="mx-auto mb-4"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p
            className="text-lg font-semibold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            No quizzes available
          </p>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
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
                {/* Card Body */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      className="text-[10px] px-2 py-0.5"
                      style={{
                        backgroundColor: "var(--color-accent-amber-subtle)",
                        color: "var(--color-accent-amber)",
                        border: "1px solid var(--color-accent-amber)",
                      }}
                    >
                      {quiz.subject}
                    </Badge>
                    {isAttempted && (
                      <Badge
                        className="text-[10px] px-2 py-0.5 flex items-center gap-1"
                        style={{
                          backgroundColor:
                            attempt.status === "pass"
                              ? "var(--color-success-subtle)"
                              : "var(--color-danger-subtle)",
                          color:
                            attempt.status === "pass"
                              ? "var(--color-success)"
                              : "var(--color-danger)",
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
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--color-text-heading)",
                      minHeight: "2.5em",
                    }}
                  >
                    {quiz.title}
                  </h3>

                  {quiz.description && (
                    <p
                      className="text-xs line-clamp-2 mb-3"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {quiz.description}
                    </p>
                  )}

                  {/* Quiz info */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock
                        size={13}
                        style={{ color: "var(--color-text-muted)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {quiz.duration} min
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target
                        size={13}
                        style={{ color: "var(--color-text-muted)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {quiz.total_marks} marks
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award
                        size={13}
                        style={{ color: "var(--color-text-muted)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Pass: {quiz.passing_marks}
                      </span>
                    </div>
                  </div>

                  {/* Attempt result or Start button */}
                  {isAttempted ? (
                    <div
                      className="rounded-lg p-3 text-center"
                      style={{
                        backgroundColor: "var(--color-bg-app)",
                        border: "1px solid var(--color-border-divider)",
                      }}
                    >
                      <p
                        className="text-xs mb-1"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Your Score
                      </p>
                      <p
                        className="text-lg font-bold"
                        style={{
                          fontFamily: "var(--font-mono)",
                          color:
                            attempt.status === "pass"
                              ? "var(--color-success)"
                              : "var(--color-danger)",
                        }}
                      >
                        {attempt.score}/{attempt.total_marks}{" "}
                        <span className="text-xs font-normal">
                          ({attempt.percentage}%)
                        </span>
                      </p>
                    </div>
                  ) : (
                    <Link
                      href={`/student/take-quiz/${quiz.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                      style={{
                        backgroundColor: "var(--color-accent-amber)",
                        color: "#000",
                      }}
                    >
                      <Play size={16} />
                      Start Quiz
                    </Link>
                  )}
                </div>

                {/* Footer */}
                <div
                  className="px-5 py-2.5"
                  style={{
                    borderTop: "1px solid var(--color-border-divider)",
                  }}
                >
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Published {formatDate(quiz.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
