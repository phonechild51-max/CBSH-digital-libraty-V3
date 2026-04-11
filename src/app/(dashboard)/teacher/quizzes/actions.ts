"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateQuizStatus(
  quizId: string,
  status: "published" | "archived" | "draft"
) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ status })
    .eq("id", quizId);

  if (error) throw new Error(`Failed to update quiz: ${error.message}`);

  revalidatePath("/teacher/quizzes");
}

export async function deleteQuiz(quizId: string) {
  const supabase = createServerClient();

  // Delete questions first (cascade doesn't happen with RLS)
  await supabase.from("questions").delete().eq("quiz_id", quizId);

  // Then delete quiz
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);

  if (error) throw new Error(`Failed to delete quiz: ${error.message}`);

  revalidatePath("/teacher/quizzes");
  revalidatePath("/teacher/dashboard");
}
