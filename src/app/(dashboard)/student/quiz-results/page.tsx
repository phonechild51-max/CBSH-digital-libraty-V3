"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import {
  Trophy,
  XCircle,
  Target,
  Clock,
  ArrowLeft,
  Percent,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AttemptData {
  id: string;
  score: number;
  total_marks: number;
  percentage: number;
  status: string;
  time_taken: number | null;
  attempt_date: string;
  quizzes: {
    title: string;
    subject: string;
    passing_marks: number;
  };
}

function QuizResultsContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attempt_id");
  const { user } = useUser();
  const { session } = useSession();
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttempt = async () => {
      if (!session || !user || !attemptId) {
        setError("No attempt found.");
        setLoading(false);
        return;
      }

      const token = await session.getToken({ template: "supabase" });
      if (!token) return;

      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data } = await sb
        .from("quiz_attempts")
        .select(
          "id, score, total_marks, percentage, status, time_taken, attempt_date, quizzes(title, subject, passing_marks)"
        )
        .eq("id", attemptId)
        .single();

      if (!data) {
        setError("Attempt not found.");
        setLoading(false);
        return;
      }

      setAttempt(data as unknown as AttemptData);
      setLoading(false);
    };

    fetchAttempt();
  }, [session, user, attemptId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-accent-amber)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="text-center py-20">
        <XCircle
          size={48}
          className="mx-auto mb-4"
          style={{ color: "var(--color-danger)" }}
        />
        <p
          className="text-lg font-semibold mb-4"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-text-heading)",
          }}
        >
          {error || "Something went wrong."}
        </p>
        <Link
          href="/student/quizzes"
          className="px-6 py-2 rounded-lg text-sm font-semibold inline-block"
          style={{
            backgroundColor: "var(--color-accent-amber)",
            color: "#000",
          }}
        >
          Back to Quizzes
        </Link>
      </div>
    );
  }

  const isPassed = attempt.status === "pass";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back button */}
      <Link
        href="/student/quizzes"
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:underline"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <ArrowLeft size={16} />
        Back to Quizzes
      </Link>

      {/* Result Card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--color-bg-card)",
          border: `2px solid ${isPassed ? "var(--color-success)" : "var(--color-danger)"}`,
        }}
      >
        {/* Header banner */}
        <div
          className="p-8 text-center"
          style={{
            background: isPassed
              ? "linear-gradient(135deg, var(--color-success-subtle), var(--color-bg-card))"
              : "linear-gradient(135deg, var(--color-danger-subtle), var(--color-bg-card))",
          }}
        >
          {isPassed ? (
            <Trophy
              size={56}
              className="mx-auto mb-4"
              style={{ color: "var(--color-success)" }}
            />
          ) : (
            <XCircle
              size={56}
              className="mx-auto mb-4"
              style={{ color: "var(--color-danger)" }}
            />
          )}

          <h2
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            {isPassed ? "Congratulations! 🎉" : "Better Luck Next Time"}
          </h2>

          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {isPassed
              ? "You have passed the quiz successfully!"
              : "You did not meet the passing score. Keep studying!"}
          </p>

          <Badge
            className="text-sm px-4 py-1.5"
            style={{
              backgroundColor: isPassed
                ? "var(--color-success)"
                : "var(--color-danger)",
              color: "#fff",
              border: "none",
            }}
          >
            {isPassed ? "PASSED" : "FAILED"}
          </Badge>
        </div>

        {/* Score Details */}
        <div className="p-6">
          <h3
            className="text-base font-semibold mb-1"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            {attempt.quizzes?.title}
          </h3>
          <p
            className="text-xs mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            {attempt.quizzes?.subject}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Score */}
            <div
              className="rounded-xl p-4 text-center"
              style={{
                backgroundColor: "var(--color-bg-app)",
                border: "1px solid var(--color-border-divider)",
              }}
            >
              <Target
                size={20}
                className="mx-auto mb-1.5"
                style={{ color: "var(--color-accent-amber)" }}
              />
              <p
                className="text-xs mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Score
              </p>
              <p
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-heading)",
                }}
              >
                {attempt.score}/{attempt.total_marks}
              </p>
            </div>

            {/* Percentage */}
            <div
              className="rounded-xl p-4 text-center"
              style={{
                backgroundColor: "var(--color-bg-app)",
                border: "1px solid var(--color-border-divider)",
              }}
            >
              <Percent
                size={20}
                className="mx-auto mb-1.5"
                style={{
                  color: isPassed
                    ? "var(--color-success)"
                    : "var(--color-danger)",
                }}
              />
              <p
                className="text-xs mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Percentage
              </p>
              <p
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: isPassed
                    ? "var(--color-success)"
                    : "var(--color-danger)",
                }}
              >
                {attempt.percentage}%
              </p>
            </div>

            {/* Passing Marks */}
            <div
              className="rounded-xl p-4 text-center"
              style={{
                backgroundColor: "var(--color-bg-app)",
                border: "1px solid var(--color-border-divider)",
              }}
            >
              <Trophy
                size={20}
                className="mx-auto mb-1.5"
                style={{ color: "var(--color-info)" }}
              />
              <p
                className="text-xs mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Pass Mark
              </p>
              <p
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-heading)",
                }}
              >
                {attempt.quizzes?.passing_marks}
              </p>
            </div>

            {/* Time Taken */}
            <div
              className="rounded-xl p-4 text-center"
              style={{
                backgroundColor: "var(--color-bg-app)",
                border: "1px solid var(--color-border-divider)",
              }}
            >
              <Clock
                size={20}
                className="mx-auto mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              />
              <p
                className="text-xs mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Time Taken
              </p>
              <p
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-heading)",
                }}
              >
                {attempt.time_taken ? formatTime(attempt.time_taken) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "var(--color-accent-amber)", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <QuizResultsContent />
    </Suspense>
  );
}
