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

/**
 * Check if the current authenticated user is a coach
 * @returns true if user is coach, false otherwise
 */
export async function isCoach(): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

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

  return data.role === 'coach' || data.role === 'gym_owner' || data.role === 'admin';
}

/**
 * Get the user's role
 * @returns user role ('user', 'admin', 'coach', 'gym_owner') or null if not found
 */
export async function getUserRole(): Promise<'user' | 'admin' | 'coach' | 'gym_owner' | null> {
  const user = await getUser();
  if (!user) return null;

  // Bypass: If user email matches ADMIN_EMAIL env var, always grant admin access
  if (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) {
    return 'admin';
  }

  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data.role as 'user' | 'admin' | 'coach' | 'gym_owner';
}

/**
 * Require coach role or throw redirect to dashboard
 * Use in Server Components/Actions that require coach access
 * Note: Admin users can also access coach features
 */
export async function requireCoach() {
  const user = await getUser();
  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
  }

  const role = await getUserRole();
  // Allow coach, gym_owner AND admin roles to access coach features
  if (role !== 'coach' && role !== 'gym_owner' && role !== 'admin') {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }
}

/**
 * Check if the current authenticated user is a gym owner
 * @returns true if user is gym_owner, false otherwise
 */
export async function isGymOwner(): Promise<boolean> {
  const user = await getUser();
  if (!user) return false;

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

  return data.role === 'gym_owner' || data.role === 'admin';
}

/**
 * Require gym_owner role or throw redirect to dashboard
 * Use in Server Components/Actions that require gym owner access
 * Note: Admin users can also access gym owner features
 */
export async function requireGymOwner() {
  const user = await getUser();
  if (!user) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
  }

  const role = await getUserRole();
  // Allow both gym_owner AND admin roles to access gym owner features
  if (role !== 'gym_owner' && role !== 'admin') {
    const { redirect } = await import('next/navigation');
    redirect('/dashboard');
  }
}

/**
 * Get the gym owned by the current user
 * @returns gym data with branding or null
 */
export async function getOwnedGym(): Promise<{
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  subscription_status: string;
} | null> {
  const user = await getUser();
  if (!user) return null;

  const { getSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('gyms')
    .select('id, name, slug, invite_code, subscription_status')
    .eq('owner_id', user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
