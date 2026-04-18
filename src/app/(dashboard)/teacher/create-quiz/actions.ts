"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface QuizData {
  title: string;
  subject: string;
  description: string | null;
  duration: number;
  passing_marks: number;
  total_marks: number;
  status: "draft" | "published";
}

interface QuestionData {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  marks: number;
}

export async function createQuizWithQuestions(
  quiz: QuizData,
  questions: QuestionData[]
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createServerClient();

  // Resolve the teacher's Supabase UUID from their Clerk ID server-side
  const { data: dbUser, error: userError } = await supabase
    .from("users")
    .select("id, role, status")
    .eq("insforge_uid", userId)
    .single();

  if (userError || !dbUser) throw new Error("User not found");
  if (dbUser.role !== "teacher" && dbUser.role !== "admin")
    throw new Error("Forbidden: only teachers can create quizzes");
  if (dbUser.status !== "approved") throw new Error("Account not approved");

  if (quiz.passing_marks > quiz.total_marks) {
    throw new Error(
      `Passing marks (${quiz.passing_marks}) cannot exceed total marks (${quiz.total_marks}).`
    );
  }

  // Insert quiz with server-resolved created_by — never trusted from client
  const { data: newQuiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      title: quiz.title,
      subject: quiz.subject,
      description: quiz.description,
      duration: quiz.duration,
      passing_marks: quiz.passing_marks,
      total_marks: quiz.total_marks,
      status: quiz.status,
      created_by: dbUser.id,
    })
    .select("id")
    .single();

  if (quizError)
    throw new Error(`Failed to create quiz: ${quizError.message}`);

  // Batch insert questions with order
  if (questions.length > 0) {
    const questionsToInsert = questions.map((q, i) => ({
      ...q,
      quiz_id: newQuiz.id,
      question_order: i + 1,
    }));

    const { error: qError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (qError)
      throw new Error(`Failed to insert questions: ${qError.message}`);
  }

  revalidatePath("/teacher/quizzes");
  revalidatePath("/teacher/dashboard");
  return newQuiz;
}
