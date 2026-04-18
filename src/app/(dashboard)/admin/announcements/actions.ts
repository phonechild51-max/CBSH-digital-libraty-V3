"use server";

import { createServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

interface AnnouncementInput {
  title: string;
  content: string;
  priority: string;
  target_role: string;
  expiry_date: string | null;
  // Note: created_by is intentionally NOT accepted from the client.
  // It is resolved server-side via auth() for security.
}

export async function createAnnouncement(data: AnnouncementInput) {
  const supabase = createServerClient();

  // Resolve the current admin's Supabase ID on the server — never trust the client for this.
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthenticated");

  const { data: adminUser } = await supabase
    .from("users")
    .select("id")
    .eq("insforge_uid", clerkId)
    .single();

  const createdBy = adminUser?.id ?? null;

  const { error } = await supabase.from("announcements").insert({
    title: data.title,
    content: data.content,
    priority: data.priority,
    target_role: data.target_role,
    expiry_date: data.expiry_date || null,
    created_by: createdBy,
    is_published: false,
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

export async function publishAnnouncement(id: string) {
  const supabase = createServerClient();

  // Mark as published and get data to know what notification to send
  const { data: announcement, error: fetchError } = await supabase
    .from("announcements")
    .update({ is_published: true })
    .eq("id", id)
    .select()
    .single();

  if (fetchError || !announcement) throw new Error(`Failed to publish announcement: ${fetchError?.message}`);

  // Fetch target users to send notifications
  let query = supabase.from("users").select("id").in("status", ["approved", "email_verified"]);
  
  if (announcement.target_role === "students") query = query.eq("role", "student");
  else if (announcement.target_role === "teachers") query = query.eq("role", "teacher");
  else if (announcement.target_role === "admins") query = query.eq("role", "admin");

  const { data: users } = await query;
  
  if (users && users.length > 0) {
    const notifications = users.map((user) => ({
      user_id: user.id,
      message: `New Announcement: ${announcement.title}`,
      type: "info",
      read: false,
    }));
    
    // Batch insert notifications
    const { error: notifError } = await supabase.from("notifications").insert(notifications);
    if (notifError) console.error("Failed to insert notifications:", notifError);
  }

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
