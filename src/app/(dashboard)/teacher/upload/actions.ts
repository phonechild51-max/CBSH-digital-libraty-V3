"use server";

import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function insertMaterial(data: {
  title: string;
  description: string | null;
  subject: string;
  semester: number | null;
  tags: string | null;
  insforge_file_key: string;
  file_type: "pdf" | "image";
  file_size: number;
  mime_type: string;
}) {
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
    throw new Error("Forbidden: only teachers can upload materials");
  if (dbUser.status !== "approved") throw new Error("Account not approved");

  const { data: record, error } = await supabase
    .from("materials")
    .insert({
      title: data.title,
      description: data.description,
      subject: data.subject,
      semester: data.semester,
      tags: data.tags,
      insforge_file_key: data.insforge_file_key,
      file_type: data.file_type,
      file_size: data.file_size,
      mime_type: data.mime_type,
      uploaded_by: dbUser.id, // ← resolved server-side, never trusted from client
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert material: ${error.message}`);

  revalidatePath("/teacher/materials");
  revalidatePath("/teacher/dashboard");
  return record;
}
