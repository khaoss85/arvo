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

/**
 * Check if the current authenticated user is an admin
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

  // Bypass: If user email matches ADMIN_EMAIL env var, always grant admin access
  // This allows the main admin to test account deletion without losing admin privileges
  if (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) {
    return true;
  }

  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return false;
  }

  return data.role === 'admin';
}

/**
 * Require admin role or throw redirect to dashboard
 * Use in Server Components/Actions that require admin access
 */
export async function requireAdmin() {
  const user = await getUser();
  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
  }

  const admin = await isAdmin();
  if (!admin) {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }
}
