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
  const { locale, setLocale } = useLocaleStore();
  const [isLocaleInitialized, setIsLocaleInitialized] = useState(false);

  // Initialize locale on first load
  useEffect(() => {
    const detected = detectUserLocale();
    if (detected !== locale) {
      setLocale(detected);
    }
    setIsLocaleInitialized(true);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Get initial session
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

  // Don't render until locale is initialized to prevent hydration mismatch
  if (!isLocaleInitialized) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
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
