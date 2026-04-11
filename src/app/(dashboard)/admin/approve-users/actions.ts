"use server";

import { createServerClient } from "@/lib/supabase/server";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function approveUser(supabaseId: string, clerkId: string, role: "teacher" | "student") {
  const supabase = createServerClient();

  // Update DB
  const { error } = await supabase
    .from("users")
    .update({ status: "approved" })
    .eq("id", supabaseId);

  if (error) throw new Error(`Failed to approve user: ${error.message}`);

  // Set role in Clerk publicMetadata
  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: { role },
  });

  revalidatePath("/admin/approve-users");
  revalidatePath("/admin/dashboard");
}

export async function denyUser(supabaseId: string) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("users")
    .update({ status: "denied" })
    .eq("id", supabaseId);

  if (error) throw new Error(`Failed to deny user: ${error.message}`);

  revalidatePath("/admin/approve-users");
  revalidatePath("/admin/dashboard");
}
