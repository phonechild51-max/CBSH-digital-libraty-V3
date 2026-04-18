"use server";

import { createServerClient } from "@/lib/supabase/server";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getAdminUsers() {
  const supabase = createServerClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email, role, status, created_at, insforge_uid, profile_picture_url")
    .order("created_at", { ascending: false });

  if (error || !users) return [];

  // Local development fallback: Merge live data from Clerk so users don't have to rely on webhooks.
  // Paginate through Clerk's user list to avoid the hard limit per-request.
  try {
    const clerk = await clerkClient();
    const PAGE_SIZE = 200;
    let offset = 0;
    const allClerkUsers: Awaited<ReturnType<typeof clerk.users.getUserList>>['data'] = [];
    while (true) {
      const page = await clerk.users.getUserList({ limit: PAGE_SIZE, offset });
      allClerkUsers.push(...page.data);
      if (page.data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    // Alias for backwards-compatible reference below
    const clerkUsers = { data: allClerkUsers };
    
    return users.map(u => {
      const cu = clerkUsers.data.find(c => c.id === u.insforge_uid);
      if (cu) {
        return {
          ...u,
          profile_picture_url: cu.imageUrl,
          name: cu.username || `${cu.firstName || ""} ${cu.lastName || ""}`.trim() || u.name
        };
      }
      return u;
    });
  } catch (err) {
    console.error("Failed to merge clerk users:", err);
    return users; // Fallback to DB if Clerk fails
  }
}

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
    publicMetadata: { 
      role,
      status: "approved",
      requested_role: null
    },
  });

  revalidatePath("/admin/approve-users");
  revalidatePath("/admin/dashboard");
}

export async function denyUser(supabaseId: string, clerkId: string) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("users")
    .update({ status: "denied" })
    .eq("id", supabaseId);

  if (error) throw new Error(`Failed to deny user: ${error.message}`);

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: {
      status: "denied",
      role: null, // Clear role if accidentally set
    },
  });

  revalidatePath("/admin/approve-users");
  revalidatePath("/admin/dashboard");
}

export async function reverseDenyUser(supabaseId: string, clerkId: string) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("users")
    .update({ status: "pending" })
    .eq("id", supabaseId);

  if (error) throw new Error(`Failed to reverse deny user: ${error.message}`);

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: {
      status: "pending",
      role: null, 
    },
  });

  revalidatePath("/admin/approve-users");
  revalidatePath("/admin/dashboard");
}

export async function changeUserRole(supabaseId: string, clerkId: string, newRole: string) {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", supabaseId);

  if (error) throw new Error(`Failed to change user role: ${error.message}`);

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkId, {
    publicMetadata: {
      role: newRole,
      status: "approved",
    },
  });

  revalidatePath("/admin/approve-users");
  revalidatePath("/admin/dashboard");
}

export async function deleteUser(supabaseId: string, clerkId: string) {
  const supabase = createServerClient();

  // 1. Delete from Supabase first
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", supabaseId);

  if (error) throw new Error(`Failed to delete user from database: ${error.message}`);

  // 2. Delete from Clerk
  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(clerkId);
  } catch (err) {
    const error = err as { errors?: { code: string }[], message?: string };
    if (error.errors && error.errors[0]?.code === "resource_not_found") {
      // User might already be deleted in Clerk, that's fine
      console.log(`Clerk user ${clerkId} not found, probably already deleted.`);
    } else {
      throw new Error(`Failed to delete user from authentication provider: ${error.message || err}`);
    }
  }

  revalidatePath("/admin/approve-users");
  revalidatePath("/admin/dashboard");
}
