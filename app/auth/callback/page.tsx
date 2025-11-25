"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";

/**
 * Client-side auth callback handler for implicit flow (hash fragment tokens).
 *
 * When Supabase redirects with tokens in the hash fragment (#access_token=...),
 * the server-side route.ts cannot see them. This page handles that case.
 *
 * Flow:
 * 1. Supabase redirects to /auth/callback#access_token=xxx&refresh_token=yyy
 * 2. This page reads the hash fragment
 * 3. Sets the session using supabase.auth.setSession()
 * 4. Redirects to /onboarding or /dashboard based on profile existence
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash;

        // Check for hash fragment tokens (implicit flow)
        if (hash && hash.includes("access_token")) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            const supabase = getSupabaseBrowserClient();

            // Set the session from hash tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Error setting session:", error);
              setStatus("error");
              setErrorMessage(error.message);
              return;
            }

            if (data.user) {
              // Track waitlist conversion if applicable
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
                // Non-blocking - continue even if tracking fails
              }

              // Check if user has completed onboarding
              const { data: profile } = await supabase
                .from("user_profiles")
                .select("user_id, first_name")
                .eq("user_id", data.user.id)
                .single();

              // Redirect based on profile existence
              // Profile exists with first_name = user completed onboarding
              // Profile exists without first_name = user needs to complete onboarding
              const hasCompletedOnboarding = profile?.first_name != null;
              router.replace(hasCompletedOnboarding ? "/dashboard" : "/onboarding");
              return;
            }
          }
        }

        // No valid tokens found - redirect to login with error
        router.replace("/login?error=auth_callback_error");
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      }
    };

    handleCallback();
  }, [router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Logo size="sm" showTagline={false} animated={false} />
        <div className="mt-8 text-center">
          <h1 className="text-xl font-semibold text-red-600">Authentication Error</h1>
          <p className="mt-2 text-muted-foreground">{errorMessage || "Failed to complete sign in"}</p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-4 text-primary underline"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Logo size="sm" showTagline={false} animated={true} />
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-muted-foreground">Completing sign in...</span>
        </div>
      </div>
    </div>
  );
}
