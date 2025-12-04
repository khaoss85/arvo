"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getQueryClient } from "@/lib/utils/query-client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLocaleStore } from "@/lib/stores/locale.store";
import { ExerciseDBService } from "@/lib/services/exercisedb.service";
import { Toaster } from "@/components/ui/toast";
import { HtmlLangWrapper } from "@/components/html-lang-wrapper";
import { GymBrandingProvider } from "@/components/providers/gym-branding-provider";
import { detectUserLocale } from "@/lib/utils/locale";
import { updatePreferredLanguage } from "@/app/actions/user-actions";
import enMessages from "@/messages/en.json";
import itMessages from "@/messages/it.json";

const messages = {
  en: enMessages,
  it: itMessages,
};

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const { user, setUser, setLoading } = useAuthStore();
  const { locale, setLocale, _hasHydrated } = useLocaleStore();
  const [isLocaleInitialized, setIsLocaleInitialized] = useState(false);

  // Initialize locale on first load, but only after Zustand has hydrated
  useEffect(() => {
    if (!_hasHydrated || isLocaleInitialized) return;

    const detected = detectUserLocale();
    if (detected !== locale) {
      setLocale(detected);
    }
    setIsLocaleInitialized(true);
  }, [_hasHydrated, isLocaleInitialized, locale, setLocale]);

  // Sync detected locale to database when user is authenticated
  // This ensures AI responses use the same language as the UI
  useEffect(() => {
    if (!isLocaleInitialized || !user?.id) return;

    // Sync current locale to database
    // This handles the case where browser language differs from database preference
    updatePreferredLanguage(user.id, locale).catch((err) => {
      console.error('[Providers] Failed to sync locale to database:', err);
    });
  }, [isLocaleInitialized, user?.id, locale]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Get initial session
    // Language preference is synced server-side via getUserLanguage() in server components
    // and via LanguageSelector component for user changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  // Pre-initialize ExerciseDB cache on app load
  useEffect(() => {
    ExerciseDBService.initializeCache().catch((err) => {
      console.error('[App] Failed to initialize ExerciseDB cache:', err);
    });
  }, []);

  // Don't render until both Zustand has hydrated and locale is initialized
  // This prevents hydration mismatches and ensures translations load correctly
  if (!_hasHydrated || !isLocaleInitialized) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        <HtmlLangWrapper />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GymBrandingProvider>
            {children}
          </GymBrandingProvider>
          <Toaster />
        </ThemeProvider>
      </NextIntlClientProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
