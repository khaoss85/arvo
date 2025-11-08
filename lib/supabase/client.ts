import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
