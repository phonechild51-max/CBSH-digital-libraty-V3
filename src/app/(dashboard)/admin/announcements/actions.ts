"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface AnnouncementInput {
  title: string;
  content: string;
  priority: string;
  target_role: string;
  expiry_date: string | null;
  created_by: string;
}

export async function createAnnouncement(data: AnnouncementInput) {
  const supabase = createServerClient();

  const { error } = await supabase.from("announcements").insert({
    title: data.title,
    content: data.content,
    priority: data.priority,
    target_role: data.target_role,
    expiry_date: data.expiry_date || null,
    created_by: data.created_by,
  });

  if (error) throw new Error(`Failed to create announcement: ${error.message}`);
  revalidatePath("/admin/announcements");
}

export async function updateAnnouncement(id: string, data: Partial<AnnouncementInput>) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("announcements")
    .update({
      title: data.title,
      content: data.content,
      priority: data.priority,
      target_role: data.target_role,
      expiry_date: data.expiry_date || null,
    })
    .eq("id", id);

  if (error) throw new Error(`Failed to update announcement: ${error.message}`);
  revalidatePath("/admin/announcements");
}

export async function deleteAnnouncement(id: string) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete announcement: ${error.message}`);
  revalidatePath("/admin/announcements");
}
