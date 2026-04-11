"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteMaterial(materialId: string, insforgeFileKey: string | null) {
  const supabase = createServerClient();

  // Delete file from storage if key exists
  if (insforgeFileKey) {
    await supabase.storage.from("cbsh-library").remove([insforgeFileKey]);
  }

  // Delete DB row
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", materialId);

  if (error) throw new Error(`Failed to delete material: ${error.message}`);

  revalidatePath("/admin/materials");
}
