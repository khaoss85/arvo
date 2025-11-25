import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";
import { EmailService } from "@/lib/services/email.service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  // Handle magic link authentication (PKCE flow)
  if (code) {
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user && data.user.email) {
      // Track waitlist conversion if user came from waitlist
      try {
        const { data: waitlistEntry } = await supabase
          .from('waitlist_entries')
          .select('id, status')
          .eq('email', data.user.email)
          .single();

        if (waitlistEntry && waitlistEntry.status !== 'converted') {
          // Update waitlist entry to mark as converted
          await supabase
            .from('waitlist_entries')
            .update({
              status: 'converted',
              converted_user_id: data.user.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', waitlistEntry.id);

          console.log('Waitlist conversion tracked for:', data.user.email);
        }
      } catch (conversionError) {
        // Log error but don't block the auth flow
        console.error('Error tracking waitlist conversion:', conversionError);
      }

      // Check if user has completed onboarding
      let hasProfile = false;
      try {
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', data.user.id)
          .single();

        hasProfile = !!existingProfile;

        // Send welcome email to new users (async, non-blocking)
        if (!existingProfile) {
          const { data: waitlistData } = await supabase
            .from('waitlist_entries')
            .select('first_name')
            .eq('email', data.user.email)
            .single();

          const firstName = waitlistData?.first_name || data.user.email?.split('@')[0] || 'there';

          // Send email asynchronously (don't await)
          EmailService.sendWelcomeEmail(data.user.id, data.user.email, firstName).catch((emailError) => {
            console.error('Error sending welcome email:', emailError);
          });
        }
      } catch (emailCheckError) {
        console.error('Error checking profile/sending welcome email:', emailCheckError);
      }

      // Smart redirect: send to onboarding if no profile exists, otherwise to dashboard
      const redirectPath = hasProfile ? next : '/onboarding';
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }

    console.error('Auth callback error (PKCE flow):', error);
  }

  // Handle email verification tokens (for signup confirmations from waitlist approval)
  if (token_hash && type) {
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

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('Email verification error:', error);
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
