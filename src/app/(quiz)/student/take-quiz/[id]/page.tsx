"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  LogOut,
} from "lucide-react";

interface QuizData {
  id: string;
  title: string;
  subject: string;
  duration: number;
  total_marks: number;
  passing_marks: number;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
  question_order: number;
}

export default function TakeQuizPage() {
  const params = useParams();
  const quizId = params.id as string;
  const router = useRouter();
  const { user } = useUser();
  const { session } = useSession();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const submitted = useRef(false);
  const startTime = useRef<number>(Date.now());

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!session || !user) return;
      const token = await session.getToken({ template: "supabase" });
      if (!token) return;

      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      const { data: quizData } = await sb
        .from("quizzes")
        .select("id, title, subject, duration, total_marks, passing_marks")
        .eq("id", quizId)
        .eq("status", "published")
        .single();

      if (!quizData) {
        setError("Quiz not found or unavailable.");
        setLoading(false);
        return;
      }

      // Fetch questions — only text and options, NOT correct_answer
      const { data: questionsData } = await sb
        .from("questions")
        .select(
          "id, question_text, option_a, option_b, option_c, option_d, marks, question_order"
        )
        .eq("quiz_id", quizId)
        .order("question_order", { ascending: true });

      if (!questionsData?.length) {
        setError("This quiz has no questions.");
        setLoading(false);
        return;
      }

      setQuiz(quizData);
      setQuestions(questionsData);
      setTimeLeft(quizData.duration * 60); // Convert minutes to seconds
      startTime.current = Date.now();
      setLoading(false);
    };

    fetchQuiz();
  }, [session, user, quizId]);

  // Timer countdown
  useEffect(() => {
    if (loading || !quiz || submitted.current) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-submit when time runs out
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, quiz]);

  // Tab close protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!submitted.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (submitted.current || submitting) return;

      const unanswered = questions.filter((q) => !answers[q.id]).length;
      if (!autoSubmit && unanswered > 0 && !showConfirm) {
        setShowConfirm(true);
        return;
      }

      submitted.current = true;
      setSubmitting(true);
      setShowConfirm(false);

      const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);

      try {
        const res = await fetch(`/api/quizzes/${quizId}/grade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, time_taken: timeTaken }),
        });

        const data = await res.json();

        if (data.success) {
          router.push(
            `/student/quiz-results?attempt_id=${data.attempt_id}`
          );
        } else {
          setError(data.error || "Submission failed.");
          submitted.current = false;
          setSubmitting(false);
        }
      } catch {
        setError("Network error. Please try again.");
        submitted.current = false;
        setSubmitting(false);
      }
    },
    [answers, questions, quizId, router, showConfirm, submitting]
  );

  const selectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Timer color
  const timerColor =
    timeLeft <= 60
      ? "var(--color-danger)"
      : timeLeft <= 300
        ? "var(--color-accent-amber)"
        : "var(--color-text-heading)";

  const timerPulse = timeLeft <= 60 ? "animate-pulse" : "";

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-app)" }}
      >
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--color-accent-amber)", borderTopColor: "transparent" }}
          />
          <p style={{ color: "var(--color-text-secondary)" }}>
            Loading quiz...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "var(--color-bg-app)" }}
      >
        <div className="text-center max-w-md">
          <AlertTriangle
            size={48}
            className="mx-auto mb-4"
            style={{ color: "var(--color-danger)" }}
          />
          <h2
            className="text-xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text-heading)",
            }}
          >
            {error}
          </h2>
          <button
            onClick={() => router.push("/student/quizzes")}
            className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: "var(--color-accent-amber)",
              color: "#000",
            }}
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const options = [
    { key: "A", text: currentQ.option_a },
    { key: "B", text: currentQ.option_b },
    { key: "C", text: currentQ.option_c },
    { key: "D", text: currentQ.option_d },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg-app)" }}
    >
      {/* Sticky Top Bar */}
      <header
        className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between backdrop-blur-lg"
        style={{
          backgroundColor: "var(--color-bg-sidebar)",
          borderBottom: "1px solid var(--color-border-divider)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/student/quizzes")}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--color-bg-input)]"
            style={{ color: "var(--color-text-muted)" }}
            title="Leave quiz"
          >
            <LogOut size={18} />
          </button>
          <div>
            <h1
              className="text-sm font-bold truncate max-w-[200px] sm:max-w-none"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-heading)",
              }}
            >
              {quiz.title}
            </h1>
            <p
              className="text-[10px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {quiz.subject} · {quiz.total_marks} marks
            </p>
          </div>
        </div>

        {/* Question counter + Timer */}
        <div className="flex items-center gap-4">
          <span
            className="text-xs font-medium hidden sm:block"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {answeredCount}/{questions.length} answered
          </span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${timerPulse}`}
            style={{
              backgroundColor: `${timerColor}15`,
              border: `1px solid ${timerColor}`,
            }}
          >
            <Clock size={14} style={{ color: timerColor }} />
            <span
              className="text-sm font-bold tabular-nums"
              style={{
                fontFamily: "var(--font-mono)",
                color: timerColor,
              }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-3xl mx-auto w-full">
        {/* Question Card */}
        <div
          className="w-full rounded-xl p-6 mb-6"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-card)",
          }}
        >
          {/* Question number + marks */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                backgroundColor: "var(--color-accent-amber-subtle)",
                color: "var(--color-accent-amber)",
                border: "1px solid var(--color-accent-amber)",
              }}
            >
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {currentQ.marks} mark{currentQ.marks > 1 ? "s" : ""}
            </span>
          </div>

          {/* Question text */}
          <p
            className="text-base font-medium mb-6 leading-relaxed"
            style={{
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-display)",
            }}
          >
            {currentQ.question_text}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {options.map(({ key, text }) => {
              const selected = answers[currentQ.id] === key;
              return (
                <button
                  key={key}
                  onClick={() => selectAnswer(currentQ.id, key)}
                  className="w-full text-left p-4 rounded-xl flex items-start gap-3 transition-all duration-200"
                  style={{
                    backgroundColor: selected
                      ? "var(--color-accent-amber-subtle)"
                      : "var(--color-bg-app)",
                    border: `2px solid ${selected ? "var(--color-accent-amber)" : "var(--color-border-divider)"}`,
                  }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{
                      backgroundColor: selected
                        ? "var(--color-accent-amber)"
                        : "var(--color-bg-input)",
                      color: selected ? "#000" : "var(--color-text-secondary)",
                    }}
                  >
                    {key}
                  </span>
                  <span
                    className="text-sm pt-1"
                    style={{
                      color: selected
                        ? "var(--color-text-heading)"
                        : "var(--color-text-primary)",
                    }}
                  >
                    {text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="w-full flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
            style={{
              border: "1px solid var(--color-border-input)",
              color: "var(--color-text-secondary)",
            }}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105 disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-accent-amber)",
                color: "#000",
              }}
            >
              <Send size={16} />
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentIndex((p) =>
                  Math.min(questions.length - 1, p + 1)
                )
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: "var(--color-accent-amber)",
                color: "#000",
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Question Grid */}
        <div
          className="w-full rounded-xl p-4"
          style={{
            backgroundColor: "var(--color-bg-card)",
            border: "1px solid var(--color-border-card)",
          }}
        >
          <p
            className="text-xs font-medium mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Question Overview
          </p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className="w-9 h-9 rounded-lg text-xs font-bold transition-all duration-200"
                  style={{
                    backgroundColor: isCurrent
                      ? "var(--color-accent-amber)"
                      : isAnswered
                        ? "var(--color-success)"
                        : "var(--color-bg-input)",
                    color: isCurrent || isAnswered ? "#000" : "var(--color-text-secondary)",
                    border: isCurrent
                      ? "2px solid var(--color-accent-amber)"
                      : "1px solid var(--color-border-input)",
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Unanswered Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="max-w-sm w-full rounded-2xl p-6 text-center"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <AlertTriangle
              size={40}
              className="mx-auto mb-4"
              style={{ color: "var(--color-warning)" }}
            />
            <h3
              className="text-lg font-bold mb-2"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-heading)",
              }}
            >
              Unanswered Questions
            </h3>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-text-secondary)" }}
            >
              You have{" "}
              <strong>
                {questions.length - answeredCount} unanswered
              </strong>{" "}
              question{questions.length - answeredCount > 1 ? "s" : ""}. Are
              you sure you want to submit?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{
                  border: "1px solid var(--color-border-input)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="px-5 py-2 rounded-lg text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-accent-amber)",
                  color: "#000",
                }}
              >
                {submitting ? "Submitting..." : "Submit Anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
