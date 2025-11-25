import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/**
 * Singleton Supabase client for browser/client-side operations
 * This client is used in Client Components and browser contexts
 */
export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use implicit flow to avoid PKCE code_verifier issues
        // PKCE requires the code_verifier to be in localStorage when the magic link is clicked,
        // which fails if the user opens the link in a different browser/tab or clears localStorage
        flowType: 'implicit'
      }
    }
  );

  return client;
}
