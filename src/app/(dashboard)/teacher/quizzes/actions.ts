"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Resolve the calling teacher's Supabase UUID from their Clerk session. */
async function getTeacherDbId(supabase: ReturnType<typeof createServerClient>) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { data: dbUser, error } = await supabase
    .from("users")
    .select("id, role, status")
    .eq("insforge_uid", userId)
    .single();

  if (error || !dbUser) throw new Error("User not found");
  if (dbUser.role !== "teacher" && dbUser.role !== "admin")
    throw new Error("Forbidden");
  if (dbUser.status !== "approved") throw new Error("Account not approved");

  return dbUser.id as string;
}

export async function updateQuizStatus(
  quizId: string,
  status: "published" | "archived" | "draft"
) {
  const supabase = createServerClient();
  const teacherDbId = await getTeacherDbId(supabase);

  const { error } = await supabase
    .from("quizzes")
    .update({ status })
    .eq("id", quizId)
    .eq("created_by", teacherDbId); // ← ownership check

  if (error) throw new Error(`Failed to update quiz: ${error.message}`);

  revalidatePath("/teacher/quizzes");
}

export async function deleteQuiz(quizId: string) {
  const supabase = createServerClient();
  const teacherDbId = await getTeacherDbId(supabase);

  // Verify ownership before deleting
  const { data: quiz, error: findError } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .eq("created_by", teacherDbId)
    .single();

  if (findError || !quiz)
    throw new Error("Quiz not found or you do not own it");

  // Delete questions first (no cascade from RLS)
  const { error: qError } = await supabase
    .from("questions")
    .delete()
    .eq("quiz_id", quizId);

  if (qError) throw new Error(`Failed to delete questions: ${qError.message}`);

  // Then delete the quiz
  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId)
    .eq("created_by", teacherDbId);

  if (error) throw new Error(`Failed to delete quiz: ${error.message}`);

  revalidatePath("/teacher/quizzes");
  revalidatePath("/teacher/dashboard");
}
