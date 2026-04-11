"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const { error } = await supabase
    .from("materials")
    .update({
      title: data.title,
      description: data.description,
      subject: data.subject,
      semester: data.semester,
      tags: data.tags,
    })
    .eq("id", materialId);

  if (error) throw new Error(`Failed to update material: ${error.message}`);

  revalidatePath("/teacher/materials");
}

export async function deleteTeacherMaterial(
  materialId: string,
  insforgeFileKey: string | null
) {
  const supabase = createServerClient();

  // Delete file from storage
  if (insforgeFileKey) {
    await supabase.storage.from("cbsh-library").remove([insforgeFileKey]);
  }

  // Delete DB row
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", materialId);

  if (error) throw new Error(`Failed to delete material: ${error.message}`);

  revalidatePath("/teacher/materials");
  revalidatePath("/teacher/dashboard");
}
