/**
 * Date Utilities
 * Centralized date formatting and parsing utilities
 */

/**
 * Format a date to ISO string (YYYY-MM-DD)
 * @param date - Date object or string
 * @returns ISO date string
 */
export function formatDateToISO(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

/**
 * Format a date to full ISO string with time
 * @param date - Date object or string
 * @returns Full ISO string
 */
export function formatDateTimeToISO(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * Format a date for display (e.g., "Jan 15, 2025")
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date and time for display (e.g., "Jan 15, 2025 at 3:30 PM")
 * @param date - Date object or string
 * @returns Formatted date and time string
 */
export function formatDateTimeForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param date - Date object or string
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const isPast = diff > 0;

  if (years > 0) {
    return isPast
      ? `${years} year${years > 1 ? 's' : ''} ago`
      : `in ${years} year${years > 1 ? 's' : ''}`;
  }
  if (months > 0) {
    return isPast
      ? `${months} month${months > 1 ? 's' : ''} ago`
      : `in ${months} month${months > 1 ? 's' : ''}`;
  }
  if (weeks > 0) {
    return isPast
      ? `${weeks} week${weeks > 1 ? 's' : ''} ago`
      : `in ${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  if (days > 0) {
    return isPast
      ? `${days} day${days > 1 ? 's' : ''} ago`
      : `in ${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return isPast
      ? `${hours} hour${hours > 1 ? 's' : ''} ago`
      : `in ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return isPast
      ? `${minutes} minute${minutes > 1 ? 's' : ''} ago`
      : `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  return 'just now';
}

/**
 * Check if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Get the start of day for a date
 * @param date - Date object or string
 * @returns Date object set to start of day (00:00:00)
 */
export function startOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Get the end of day for a date
 * @param date - Date object or string
 * @returns Date object set to end of day (23:59:59)
 */
export function endOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

/**
 * Add days to a date
 * @param date - Date object or string
 * @param days - Number of days to add (can be negative)
 * @returns New date object
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * Get date range (start and end) for a period
 * @param period - Period type ('today', 'week', 'month', 'year')
 * @returns Object with start and end dates
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'year'): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + (6 - dayOfWeek));
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

/**
 * Parse a date string to Date object
 * @param dateString - Date string in any format
 * @returns Date object or null if invalid
 */
export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calculate duration between two dates in days
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between dates
 */
export function getDaysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
