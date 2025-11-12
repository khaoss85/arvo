import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'it'] as const;
export type Locale = (typeof locales)[number];

// Default locale (English as per user preference)
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale parameter is valid
  const validLocale = locale && locales.includes(locale as Locale) ? locale : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
