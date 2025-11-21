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
import { detectUserLocale } from "@/lib/utils/locale";
import enMessages from "@/messages/en.json";
import itMessages from "@/messages/it.json";

const messages = {
  en: enMessages,
  it: itMessages,
};

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const { setUser, setLoading } = useAuthStore();
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

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Sync user's preferred language from DB
    const syncLanguageFromDB = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('preferred_language')
          .eq('user_id', userId)
          .single();

        if (!error && data?.preferred_language) {
          const dbLanguage = data.preferred_language;
          if ((dbLanguage === 'en' || dbLanguage === 'it') && dbLanguage !== locale) {
            console.log('[Providers] Syncing language from DB:', dbLanguage);
            setLocale(dbLanguage);
          }
        }
      } catch (err) {
        console.error('[Providers] Failed to sync language from DB:', err);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      // Sync language from DB if user is logged in
      if (session?.user) {
        syncLanguageFromDB(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Sync language from DB on login
      if (session?.user) {
        syncLanguageFromDB(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, locale, setLocale]);

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
          {children}
          <Toaster />
        </ThemeProvider>
      </NextIntlClientProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
