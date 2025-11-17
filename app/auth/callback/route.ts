import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database.types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

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

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
