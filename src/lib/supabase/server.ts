import { createClient } from '@supabase/supabase-js'

/**
 * Creates a server-side Supabase client using the service role key.
 * This bypasses RLS — use only in API routes and server actions
 * where you've already verified the user's identity via Clerk.
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
