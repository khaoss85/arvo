import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side authentication utilities
 * These can only be used in Server Components and Server Actions
 */

export async function getSession() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return session;
}

export async function getUser() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user;
}
