"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";
import { EmailService } from "@/lib/services/email.service";

export type AuthResult = {
  success: boolean;
  redirectTo: string;
  error?: string;
};

/**
 * Server action to exchange PKCE code for session.
 * This needs to run on the server to properly set cookies.
 */
export async function exchangeCodeForSession(code: string): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
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
              // Silent fail in Server Component context
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user || !data.user.email) {
      console.error('PKCE exchange error:', error);
      return {
        success: false,
        redirectTo: '/login?error=auth_callback_error',
        error: error?.message || 'Failed to exchange code for session',
      };
    }

    // Track waitlist conversion
    try {
      const { data: waitlistEntry } = await supabase
        .from('waitlist_entries')
        .select('id, status')
        .eq('email', data.user.email)
        .single();

      if (waitlistEntry && waitlistEntry.status !== 'converted') {
        await supabase
          .from('waitlist_entries')
          .update({
            status: 'converted',
            converted_user_id: data.user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', waitlistEntry.id);
      }
    } catch {
      // Non-blocking
    }

    // Check onboarding status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, first_name')
      .eq('user_id', data.user.id)
      .single();

    const hasCompletedOnboarding = profile?.first_name != null;

    // Send welcome email if not onboarded
    if (!hasCompletedOnboarding) {
      try {
        const { data: waitlistData } = await supabase
          .from('waitlist_entries')
          .select('first_name')
          .eq('email', data.user.email)
          .single();

        const firstName = waitlistData?.first_name || data.user.email?.split('@')[0] || 'there';
        EmailService.sendWelcomeEmail(data.user.id, data.user.email, firstName).catch(console.error);
      } catch {
        // Non-blocking
      }
    }

    return {
      success: true,
      redirectTo: hasCompletedOnboarding ? '/dashboard' : '/onboarding',
    };
  } catch (err) {
    console.error('exchangeCodeForSession error:', err);
    return {
      success: false,
      redirectTo: '/login?error=auth_callback_error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Server action to verify OTP token.
 */
export async function verifyOtpToken(tokenHash: string, type: string): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
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
              // Silent fail
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    });

    if (error || !data.user || !data.user.email) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        redirectTo: '/login?error=auth_callback_error',
        error: error?.message || 'Failed to verify token',
      };
    }

    // Track waitlist conversion
    try {
      const { data: waitlistEntry } = await supabase
        .from('waitlist_entries')
        .select('id, status')
        .eq('email', data.user.email)
        .single();

      if (waitlistEntry && waitlistEntry.status !== 'converted') {
        await supabase
          .from('waitlist_entries')
          .update({
            status: 'converted',
            converted_user_id: data.user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', waitlistEntry.id);
      }
    } catch {
      // Non-blocking
    }

    // Check onboarding status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, first_name')
      .eq('user_id', data.user.id)
      .single();

    const hasCompletedOnboarding = profile?.first_name != null;

    // Send welcome email if not onboarded
    if (!hasCompletedOnboarding) {
      try {
        const { data: waitlistData } = await supabase
          .from('waitlist_entries')
          .select('first_name')
          .eq('email', data.user.email)
          .single();

        const firstName = waitlistData?.first_name || data.user.email?.split('@')[0] || 'there';
        EmailService.sendWelcomeEmail(data.user.id, data.user.email, firstName).catch(console.error);
      } catch {
        // Non-blocking
      }
    }

    return {
      success: true,
      redirectTo: hasCompletedOnboarding ? '/dashboard' : '/onboarding',
    };
  } catch (err) {
    console.error('verifyOtpToken error:', err);
    return {
      success: false,
      redirectTo: '/login?error=auth_callback_error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
