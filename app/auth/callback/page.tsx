"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { verifyOtpToken } from "./actions";

/**
 * Auth callback page that handles all authentication flows:
 * 1. PKCE flow (code query param) - uses browser client (code_verifier in localStorage)
 * 2. OTP flow (token_hash query param) - uses server action
 * 3. Implicit flow (hash fragment) - handles client-side with setSession
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Prevent double execution (React Strict Mode in dev)
    if (isProcessingRef.current) {
      console.log("[AuthCallback] Already processing, skipping...");
      return;
    }

    const handleCallback = async () => {
      isProcessingRef.current = true;

      try {
        // Get query params
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        console.log("[AuthCallback] Processing:", { code: !!code, tokenHash: !!tokenHash, type, hash: !!window.location.hash });

        // 1. Handle PKCE flow (magic link login)
        // Must use browser client because code_verifier is stored in localStorage
        if (code) {
          const supabase = getSupabaseBrowserClient();
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error || !data.user || !data.user.email) {
            console.error("PKCE exchange error:", error);
            setStatus("error");
            setErrorMessage(error?.message || "Failed to complete sign in");
            return;
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
            .from("user_profiles")
            .select("user_id, first_name")
            .eq("user_id", data.user.id)
            .single();

          const hasCompletedOnboarding = profile?.first_name != null;
          router.replace(hasCompletedOnboarding ? "/dashboard" : "/onboarding");
          return;
        }

        // 2. Handle OTP flow (email verification)
        if (tokenHash && type) {
          const result = await verifyOtpToken(tokenHash, type);
          if (result.success) {
            router.replace(result.redirectTo);
          } else {
            setStatus("error");
            setErrorMessage(result.error || "Failed to verify email");
          }
          return;
        }

        // 3. Handle implicit flow (hash fragment tokens)
        const hash = window.location.hash;
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

            if (data.user && data.user.email) {
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
                .from("user_profiles")
                .select("user_id, first_name")
                .eq("user_id", data.user.id)
                .single();

              const hasCompletedOnboarding = profile?.first_name != null;
              router.replace(hasCompletedOnboarding ? "/dashboard" : "/onboarding");
              return;
            }
          }
        }

        // No valid auth data found in URL params
        // BUT check if session was already established (race condition with double request)
        console.log("[AuthCallback] No auth params, checking for existing session...");
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log("[AuthCallback] Found existing session, redirecting...");
          // Session exists, redirect based on onboarding status
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("first_name")
            .eq("user_id", session.user.id)
            .single();

          const hasCompletedOnboarding = profile?.first_name != null;
          router.replace(hasCompletedOnboarding ? "/dashboard" : "/onboarding");
          return;
        }

        // No session either, show error
        console.log("[AuthCallback] No session found, showing error");
        setStatus("error");
        setErrorMessage("No authentication data found. Please try signing in again.");
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-geometric-pattern">
        <Logo size="sm" showTagline={false} animated={false} />
        <div className="mt-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-red-600">Authentication Error</h1>
          <p className="mt-2 text-muted-foreground">{errorMessage || "Failed to complete sign in"}</p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-geometric-pattern">
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

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-geometric-pattern">
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
              <span className="text-muted-foreground">Loading...</span>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
