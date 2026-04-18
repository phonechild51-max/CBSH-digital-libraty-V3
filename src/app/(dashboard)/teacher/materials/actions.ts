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

export async function updateMaterial(
  materialId: string,
  data: {
    title: string;
    description: string | null;
    subject: string;
    semester: number | null;
    tags: string | null;
  }
) {
  const supabase = createServerClient();
  const teacherDbId = await getTeacherDbId(supabase);

  const { error } = await supabase
    .from("materials")
    .update({
      title: data.title,
      description: data.description,
      subject: data.subject,
      semester: data.semester,
      tags: data.tags,
    })
    .eq("id", materialId)
    .eq("uploaded_by", teacherDbId); // ← ownership check

  if (error) throw new Error(`Failed to update material: ${error.message}`);

  revalidatePath("/teacher/materials");
}

export async function deleteTeacherMaterial(
  materialId: string,
  insforgeFileKey: string | null
) {
  const supabase = createServerClient();
  const teacherDbId = await getTeacherDbId(supabase);

  // Verify ownership before deleting
  const { data: material, error: findError } = await supabase
    .from("materials")
    .select("id")
    .eq("id", materialId)
    .eq("uploaded_by", teacherDbId)
    .single();

  if (findError || !material)
    throw new Error("Material not found or you do not own it");

  // Delete file from storage — check error (BUG-02 fix)
  if (insforgeFileKey) {
    const { error: storageError } = await supabase.storage
      .from("cbsh-library")
      .remove([insforgeFileKey]);

    if (storageError)
      throw new Error(`Failed to remove file: ${storageError.message}`);
  }

  // Delete DB row
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", materialId)
    .eq("uploaded_by", teacherDbId);

  if (error) throw new Error(`Failed to delete material: ${error.message}`);

  revalidatePath("/teacher/materials");
  revalidatePath("/teacher/dashboard");
}
