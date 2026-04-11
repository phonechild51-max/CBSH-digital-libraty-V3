"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function setRoleAction(role: "student" | "teacher") {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Update Clerk Metadata
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: role,
    },
  });

  const email = user.emailAddresses[0]?.emailAddress;
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || email || "Unknown";

  // Update Supabase (Upsert to prevent race condition with webhook)
  const sb = createServerClient();
  const { error } = await sb.from("users").upsert(
    {
      insforge_uid: userId,
      name: name,
      email: email,
      role: role,
      status: "pending",
    },
    { onConflict: "insforge_uid" }
  );

  if (error) {
    console.error("Failed to update role in Supabase:", error);
    throw new Error("Database error when setting role.");
  }

  // Redirect to home page (which will route to the proper pending screen)
  redirect("/");
}
