import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { z } from "zod";

const magicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Client-side authentication service
 * For server-side auth operations, see lib/utils/auth.server.ts
 */
export class AuthService {
  /**
   * Send magic link to user's email (client-side)
   */
  static async sendMagicLink(email: string) {
    const validated = magicLinkSchema.parse({ email });
    const supabase = getSupabaseBrowserClient();

    // Use environment variable for redirect URL to ensure consistency across environments
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    const { data, error } = await supabase.auth.signInWithOtp({
      email: validated.email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Sign out current user (client-side)
   */
  static async signOut() {
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get current user (client-side)
   */
  static async getUserClient() {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    return user;
  }
}
