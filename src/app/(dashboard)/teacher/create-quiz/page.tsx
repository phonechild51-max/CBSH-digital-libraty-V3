"use client";

import { useState, useTransition } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createQuizWithQuestions } from "./actions";
import { SUBJECTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,

  Save,
  Send,
} from "lucide-react";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  marks: number;
}

const emptyQuestion = (): Question => ({
  id: crypto.randomUUID(),
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "A",
  marks: 1,
});

export default function CreateQuizPage() {
  const { session } = useSession();
  const { user } = useUser();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Quiz settings
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [passingMarks, setPassingMarks] = useState("");

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalForm, setModalForm] = useState<Question>(emptyQuestion());

  // Status
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const canPublish =
    title.trim() &&
    subject &&
    questions.length >= 1 &&
    parseInt(passingMarks || "0") <= totalMarks &&
    parseInt(passingMarks || "0") > 0;

  const canSaveDraft = title.trim() && subject;

  const openAddQuestion = () => {
    setEditingIndex(null);
    setModalForm(emptyQuestion());
    setShowModal(true);
  };

  const openEditQuestion = (index: number) => {
    setEditingIndex(index);
    setModalForm({ ...questions[index] });
    setShowModal(true);
  };

  const saveQuestion = () => {
    if (
      !modalForm.question_text.trim() ||
      !modalForm.option_a.trim() ||
      !modalForm.option_b.trim() ||
      !modalForm.option_c.trim() ||
      !modalForm.option_d.trim()
    ) {
      return;
    }

    if (editingIndex !== null) {
      setQuestions((prev) =>
        prev.map((q, i) => (i === editingIndex ? { ...modalForm } : q))
      );
    } else {
      setQuestions((prev) => [...prev, { ...modalForm }]);
    }
    setShowModal(false);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (status === "published" && !canPublish) return;
    if (status === "draft" && !canSaveDraft) return;

    setError(null);

    try {
      const token = await session?.getToken({ template: "supabase" });
      if (!token || !user) throw new Error("Not authenticated");

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

      if (!userData) throw new Error("User not found");

      const pm = parseInt(passingMarks || "0") || 0;

      startTransition(async () => {
        try {
          await createQuizWithQuestions(
            {
              title: title.trim(),
              subject,
              description: description.trim() || null,
              duration: parseInt(duration) || 30,
              passing_marks: pm,
              total_marks: totalMarks,
              status,
            },
            questions.map((q) => ({
              question_text: q.question_text.trim(),
              option_a: q.option_a.trim(),
              option_b: q.option_b.trim(),
              option_c: q.option_c.trim(),
              option_d: q.option_d.trim(),
              correct_answer: q.correct_answer,
              marks: q.marks,
            }))
          );

          setSuccess(true);
          setTimeout(() => {
            router.push("/teacher/quizzes");
          }, 1500);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Failed to create quiz");
        }
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
    }
  };

  const inputStyle = {
    backgroundColor: "var(--color-bg-input)",
    border: "1px solid var(--color-border-input)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h2
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--color-text-heading)",
        }}
      >
        Create Quiz
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Quiz Settings (40%) */}
        <div className="lg:col-span-2 space-y-4">
          <div
            className="rounded-xl p-5 space-y-4"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <h3
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--color-text-heading)" }}
            >
              Quiz Settings
            </h3>

            {/* Title */}
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Title <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Quiz title..."
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>

            {/* Subject */}
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Subject <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                <option value="">Select subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional quiz description..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                style={inputStyle}
              />
            </div>

            {/* Duration & Passing Marks */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Duration (min)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={5}
                  max={180}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Passing Marks
                </label>
                <input
                  type="number"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(e.target.value)}
                  min={0}
                  className="w-full px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Summary */}
            <div
              className="rounded-lg p-3 mt-2"
              style={{
                backgroundColor: "var(--color-bg-app)",
                border: "1px solid var(--color-border-divider)",
              }}
            >
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>
                  Total Marks
                </span>
                <span
                  style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {totalMarks}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span style={{ color: "var(--color-text-muted)" }}>
                  Questions
                </span>
                <span
                  style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {questions.length}
                </span>
              </div>
              {parseInt(passingMarks || "0") > totalMarks &&
                totalMarks > 0 && (
                  <p
                    className="text-xs mt-2 flex items-center gap-1"
                    style={{ color: "var(--color-danger)" }}
                  >
                    <AlertCircle size={12} />
                    Passing marks exceed total marks
                  </p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleSubmit("draft")}
                disabled={!canSaveDraft || isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--color-bg-input)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-card)",
                }}
              >
                <Save size={16} />
                {isPending ? "Saving…" : "Save Draft"}
              </button>
              <button
                onClick={() => handleSubmit("published")}
                disabled={!canPublish || isPending}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "var(--color-accent-amber)",
                  color: "#000",
                }}
              >
                <Send size={16} />
                {isPending ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl p-3 flex items-center gap-2 text-sm"
              style={{
                backgroundColor: "var(--color-danger-subtle)",
                color: "var(--color-danger)",
                borderLeft: "4px solid var(--color-danger)",
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div
              className="rounded-xl p-3 flex items-center gap-2 text-sm animate-fade-in-up"
              style={{
                backgroundColor: "var(--color-success-subtle)",
                color: "var(--color-success)",
                borderLeft: "4px solid var(--color-success)",
              }}
            >
              <CheckCircle2 size={16} />
              Quiz created! Redirecting…
            </div>
          )}
        </div>

        {/* Right — Questions List (60%) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-heading)" }}
            >
              Questions ({questions.length})
            </h3>
            <button
              onClick={openAddQuestion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
              style={{
                backgroundColor: "var(--color-accent-amber)",
                color: "#000",
              }}
            >
              <Plus size={14} />
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{
                backgroundColor: "var(--color-bg-card)",
                border: "2px dashed var(--color-border-input)",
              }}
            >
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                No questions added yet. Click &quot;Add Question&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    backgroundColor: "var(--color-bg-card)",
                    border: "1px solid var(--color-border-card)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: "var(--color-accent-amber-glow)",
                        color: "var(--color-accent-amber)",
                        border: "1px solid var(--color-accent-amber)",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {q.question_text}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {(["A", "B", "C", "D"] as const).map((opt) => {
                          const key = `option_${opt.toLowerCase()}` as keyof Question;
                          return (
                            <span
                              key={opt}
                              className="text-xs px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor:
                                  q.correct_answer === opt
                                    ? "var(--color-success-subtle)"
                                    : "var(--color-bg-input)",
                                color:
                                  q.correct_answer === opt
                                    ? "var(--color-success)"
                                    : "var(--color-text-muted)",
                                border:
                                  q.correct_answer === opt
                                    ? "1px solid var(--color-success)"
                                    : "1px solid var(--color-border-input)",
                              }}
                            >
                              {opt}. {String(q[key]).substring(0, 30)}
                              {String(q[key]).length > 30 ? "…" : ""}
                            </span>
                          );
                        })}
                        <Badge
                          className="text-[10px]"
                          style={{
                            backgroundColor: "var(--color-accent-amber-subtle)",
                            color: "var(--color-accent-amber)",
                            border: "1px solid var(--color-accent-amber)",
                          }}
                        >
                          {q.marks} mark{q.marks > 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditQuestion(i)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-accent-amber-glow)]"
                        style={{ color: "var(--color-accent-amber)" }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => removeQuestion(i)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-danger-subtle)]"
                        style={{ color: "var(--color-danger)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-xl p-6 space-y-4 z-10 max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: "var(--color-bg-card)",
              border: "1px solid var(--color-border-card)",
            }}
          >
            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-semibold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-heading)",
                }}
              >
                {editingIndex !== null ? "Edit Question" : "Add Question"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg"
                style={{ color: "var(--color-text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Question Text */}
              <div>
                <label
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Question <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <textarea
                  value={modalForm.question_text}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, question_text: e.target.value })
                  }
                  rows={3}
                  placeholder="Enter question text..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={inputStyle}
                />
              </div>

              {/* Options */}
              {(["A", "B", "C", "D"] as const).map((opt) => {
                const key = `option_${opt.toLowerCase()}` as
                  | "option_a"
                  | "option_b"
                  | "option_c"
                  | "option_d";
                return (
                  <div key={opt}>
                    <label
                      className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Option {opt}{" "}
                      <span style={{ color: "var(--color-danger)" }}>*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={modalForm[key]}
                        onChange={(e) =>
                          setModalForm({ ...modalForm, [key]: e.target.value })
                        }
                        placeholder={`Option ${opt}...`}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setModalForm({ ...modalForm, correct_answer: opt })
                        }
                        className="px-3 py-2.5 rounded-xl text-xs font-bold transition-colors"
                        style={{
                          backgroundColor:
                            modalForm.correct_answer === opt
                              ? "var(--color-success-subtle)"
                              : "var(--color-bg-input)",
                          color:
                            modalForm.correct_answer === opt
                              ? "var(--color-success)"
                              : "var(--color-text-muted)",
                          border:
                            modalForm.correct_answer === opt
                              ? "1px solid var(--color-success)"
                              : "1px solid var(--color-border-input)",
                        }}
                      >
                        {modalForm.correct_answer === opt ? "✓ Correct" : "Set"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Marks */}
              <div>
                <label
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Marks
                </label>
                <input
                  type="number"
                  value={modalForm.marks}
                  onChange={(e) =>
                    setModalForm({
                      ...modalForm,
                      marks: parseInt(e.target.value) || 1,
                    })
                  }
                  min={1}
                  className="w-24 px-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={saveQuestion}
                disabled={
                  !modalForm.question_text.trim() ||
                  !modalForm.option_a.trim() ||
                  !modalForm.option_b.trim() ||
                  !modalForm.option_c.trim() ||
                  !modalForm.option_d.trim()
                }
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
                style={{
                  backgroundColor: "var(--color-accent-amber)",
                  color: "#000",
                }}
              >
                {editingIndex !== null ? "Update Question" : "Add Question"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: "var(--color-bg-input)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border-card)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
