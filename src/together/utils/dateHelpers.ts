/**
 * Date Helper Utilities for Together Feature
 * Calculate countdowns, anniversaries, and date formatting
 */

/**
 * Parse date string (YYYY-MM-DD) without timezone shift
 */
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calculate days until a date
 */
export function getDaysUntil(dateString: string): number {
  const target = parseLocalDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get countdown text (e.g., "In 2 days", "Today", "29 days ago")
 */
export function getCountdownText(dateString: string): string {
  const days = getDaysUntil(dateString);

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `In ${days} ${days === 1 ? 'day' : 'days'}`;
  return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`;
}

/**
 * Get next occurrence of a recurring date
 */
export function getNextOccurrence(dateString: string, recurring: boolean): string {
  if (!recurring) return dateString;

  const date = parseLocalDate(dateString);
  const today = new Date();
  const thisYear = today.getFullYear();

  // Create this year's occurrence
  const thisYearDate = new Date(
    thisYear,
    date.getMonth(),
    date.getDate()
  );

  // Normalize both dates to midnight for accurate comparison
  thisYearDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // If this year's occurrence has passed, return next year
  if (thisYearDate < today) {
    const nextYear = new Date(
      thisYear + 1,
      date.getMonth(),
      date.getDate()
    );
    const year = nextYear.getFullYear();
    const month = String(nextYear.getMonth() + 1).padStart(2, '0');
    const day = String(nextYear.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const year = thisYearDate.getFullYear();
  const month = String(thisYearDate.getMonth() + 1).padStart(2, '0');
  const day = String(thisYearDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate age based on birthday
 */
export function calculateAge(birthdayString: string): number {
  const birthday = parseLocalDate(birthdayString);
  const today = new Date();

  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get age text for birthday milestone (e.g., "Turning 35 years old")
 */
export function getAgeText(birthdayString: string): string {
  const age = calculateAge(birthdayString);
  const nextAge = age + 1;

  return `Turning ${nextAge} years old`;
}

/**
 * Calculate years together from anniversary date
 */
export function calculateYearsTogether(anniversaryString: string): number {
  const anniversary = parseLocalDate(anniversaryString);
  const today = new Date();

  let years = today.getFullYear() - anniversary.getFullYear();
  const monthDiff = today.getMonth() - anniversary.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < anniversary.getDate())) {
    years--;
  }

  return years;
}

/**
 * Calculate days together from anniversary date
 */
export function calculateDaysTogether(anniversaryString: string): number {
  const anniversary = parseLocalDate(anniversaryString);
  const today = new Date();
  anniversary.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - anniversary.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get anniversary text (e.g., "10 years together", "3,652 days • 8 months")
 */
export function getAnniversaryText(anniversaryString: string): {
  years: string;
  details: string;
} {
  const years = calculateYearsTogether(anniversaryString);
  const days = calculateDaysTogether(anniversaryString);

  const yearsText = `${years} ${years === 1 ? 'year' : 'years'} together ❤️`;

  const months = Math.floor((days % 365) / 30);
  const detailsText = `${days.toLocaleString()} days • ${months} ${months === 1 ? 'month' : 'months'}`;

  return {
    years: yearsText,
    details: detailsText,
  };
}

/**
 * Format date for display (e.g., "February 18, 2026")
 */
export function formatDateLong(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date for input (YYYY-MM-DD)
 */
export function formatDateInput(dateString: string): string {
  // If already in correct format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  const date = parseLocalDate(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
