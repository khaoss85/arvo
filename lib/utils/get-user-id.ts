/**
 * Client-side utility to get the current user ID
 * This can be used in Client Components
 */
export async function getUserId(): Promise<string | null> {
  const { getSupabaseBrowserClient } = await import('@/lib/supabase/client')
  const supabase = getSupabaseBrowserClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user.id
}
