/**
 * Shared utility functions for waitlist-related components
 * Used by: waitlist-offer-modal.tsx, waitlist-panel.tsx, join-waitlist-modal.tsx
 */

// Short day names for displaying preferred days
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/**
 * Format an array of day numbers into a readable string
 * @param days - Array of day numbers (0=Sunday, 6=Saturday)
 * @param anyDayLabel - Label to show when all days or no days are selected (defaults to 'Any day')
 * @returns Formatted string like "Mon, Wed, Fri" or "Any day"
 */
export function formatDays(
  days: number[] | null | undefined,
  anyDayLabel: string = 'Any day'
): string {
  if (!days || days.length === 0) return anyDayLabel;
  if (days.length === 7) return anyDayLabel;
  return days.map(d => DAY_NAMES_SHORT[d]).join(', ');
}

/**
 * Format a time range into a readable string
 * @param start - Start time in HH:MM:SS format
 * @param end - End time in HH:MM:SS format
 * @param anyTimeLabel - Label to show when no times are specified (defaults to 'Any time')
 * @returns Formatted string like "09:00-17:00" or "Any time"
 */
export function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
  anyTimeLabel: string = 'Any time'
): string {
  if (!start && !end) return anyTimeLabel;
  const startStr = start ? start.slice(0, 5) : '';
  const endStr = end ? end.slice(0, 5) : '';
  if (startStr && endStr) return `${startStr}-${endStr}`;
  if (startStr) return `${startStr}+`;
  if (endStr) return `-${endStr}`;
  return anyTimeLabel;
}

/**
 * Calculate the number of days someone has been waiting
 * @param createdAt - ISO date string when the waitlist entry was created
 * @returns Number of days waiting
 */
export function getDaysWaiting(createdAt: string | null | undefined): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate time remaining until a deadline
 * @param deadline - ISO date string for the deadline
 * @returns Object with hours and minutes remaining
 */
export function getTimeRemaining(deadline: string): { hours: number; minutes: number } {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0 };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}
