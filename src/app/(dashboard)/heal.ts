"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export async function healUserSyncAction() {
  const { userId } = await auth();
  if (!userId) return { success: false, reason: "No user" };

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const role = user.publicMetadata?.role as string | undefined;
  if (!role) return { success: false, reason: "No role" };

  const email = user.emailAddresses[0]?.emailAddress;
  const name =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || email || "Unknown";

  const sb = createServerClient();
  
  // Try to find if user exists
  const { data: existingUser } = await sb
    .from("users")
    .select("id, status")
    .eq("insforge_uid", userId)
    .single();

  if (!existingUser) {
    // Upsert the user to heal the mismatch
    const { error, data } = await sb
      .from("users")
      .upsert(
        {
          insforge_uid: userId,
          name: name,
          email: email,
          role: role,
          status: role === "admin" ? "approved" : "pending",
        },
        { onConflict: "insforge_uid" }
      )
      .select("status")
      .single();

    if (error) {
      console.error("Heal user sync failed:", error);
      return { success: false, reason: "DB Error" };
    }
    
    return { success: true, status: data?.status || "pending" };
  }

  return { success: true, status: existingUser.status };
}
