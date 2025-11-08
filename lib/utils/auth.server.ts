/**
 * Server-side authentication utilities
 * These can only be used in Server Components and Server Actions
 */

export async function getSession() {
  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  // If there's no session or auth error, return null
  if (error || !session) {
    return null;
  }

  return session;
}

export async function getUser() {
  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If there's no user or auth error, return null instead of throwing
  if (error || !user) {
    return null;
  }

  return user;
}
