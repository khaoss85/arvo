// NOTE: Cannot enable "server-only" yet because services are imported in both client and server contexts
// Services like WorkoutService have both client methods (used in Client Components/hooks)
// and server methods (used in Server Components like dashboard/page.tsx)
// To enable server-only, we would need to split services into separate client/server files
// import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

/**
 * Create Supabase client for Server Components and Server Actions
 * This creates a new client for each request to ensure proper cookie handling
 */
export async function getSupabaseServerClient() {
  // Dynamic import of next/headers to avoid bundling issues with client components
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
