"use server";

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
  uploaded_by: string;
}) {
  const supabase = createServerClient();

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
      uploaded_by: data.uploaded_by,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert material: ${error.message}`);

  revalidatePath("/teacher/materials");
  revalidatePath("/teacher/dashboard");
  return record;
}
