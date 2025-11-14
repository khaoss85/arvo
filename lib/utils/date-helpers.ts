import { formatDistanceToNow, format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { it, enUS } from 'date-fns/locale';

const locales = {
  en: enUS,
  it: it,
};

/**
 * Get relative time string (e.g., "2 days ago", "1 hour ago")
 * Returns localized string based on locale parameter
 */
export function getRelativeTime(date: Date | string, locale: 'en' | 'it' = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const minutes = differenceInMinutes(now, dateObj);
  const hours = differenceInHours(now, dateObj);
  const days = differenceInDays(now, dateObj);

  // Handle "just now" / "oggi"
  if (minutes < 1) {
    return locale === 'en' ? 'Just now' : 'Proprio ora';
  }

  // Handle "X minutes ago"
  if (minutes < 60) {
    return locale === 'en'
      ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
      : `${minutes} ${minutes === 1 ? 'minuto' : 'minuti'} fa`;
  }

  // Handle "X hours ago"
  if (hours < 24) {
    return locale === 'en'
      ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
      : `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`;
  }

  // Handle "today" / "oggi"
  if (days === 0) {
    return locale === 'en' ? 'Today' : 'Oggi';
  }

  // Handle "yesterday" / "ieri"
  if (days === 1) {
    return locale === 'en' ? 'Yesterday' : 'Ieri';
  }

  // Handle "X days ago" (up to 7 days)
  if (days < 7) {
    return locale === 'en'
      ? `${days} days ago`
      : `${days} giorni fa`;
  }

  // Handle "1 week ago" / "1 settimana fa"
  if (days < 14) {
    return locale === 'en' ? '1 week ago' : '1 settimana fa';
  }

  // For older dates, use date-fns formatDistanceToNow
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: locales[locale],
  });
}

/**
 * Format date to display format (e.g., "Nov 14, 2025")
 */
export function formatDisplayDate(date: Date | string, locale: 'en' | 'it' = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatPattern = locale === 'en' ? 'MMM d, yyyy' : 'd MMM yyyy';

  return format(dateObj, formatPattern, {
    locale: locales[locale],
  });
}

/**
 * Format time to display format (e.g., "14:30")
 */
export function formatDisplayTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
}

/**
 * Format date and time together (e.g., "Nov 14, 2025 at 14:30")
 */
export function formatDisplayDateTime(date: Date | string, locale: 'en' | 'it' = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatDisplayDate(dateObj, locale);
  const timeStr = formatDisplayTime(dateObj);

  return locale === 'en'
    ? `${dateStr} at ${timeStr}`
    : `${dateStr} alle ${timeStr}`;
}

/**
 * Format duration in seconds to readable string (e.g., "1h 23m")
 */
export function formatDuration(seconds: number, locale: 'en' | 'it' = 'en'): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return locale === 'en'
      ? `${hours}h ${minutes}m`
      : `${hours}h ${minutes}m`;
  }

  return locale === 'en'
    ? `${minutes}m`
    : `${minutes}m`;
}
