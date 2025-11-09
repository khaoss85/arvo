import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Admin Supabase Client
 *
 * Uses the service role key to bypass Row Level Security (RLS).
 * ONLY use this for administrative operations that require elevated permissions.
 *
 * ⚠️ SECURITY WARNING:
 * - Never expose this client to the browser/client-side
 * - Only use in Server Actions or API Routes
 * - The service role key has FULL database access
 *
 * Use cases:
 * - Deleting users from auth.users (requires admin privileges)
 * - Bypassing RLS for administrative queries
 * - Bulk operations that need elevated permissions
 *
 * Required environment variable:
 * - SUPABASE_SERVICE_ROLE_KEY (get from Supabase Dashboard > Project Settings > API)
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'This is required for admin operations like account deletion. ' +
      'Get this key from: Supabase Dashboard > Project Settings > API > service_role key'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
