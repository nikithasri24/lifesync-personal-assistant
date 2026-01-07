/**
 * Important Dates Service
 * Business logic for birthdays, anniversaries, and other important dates
 *
 * This service uses the API layer for data access and provides
 * higher-level business logic operations.
 */

import { format, differenceInDays, getYear } from 'date-fns';
import * as importantDatesAPI from '@/api/importantDatesAPI';
import { logger } from '@/services/logger';
import type {
  ImportantDate, UpcomingDate, CreateImportantDateInput,
  UpdateImportantDateInput, DatesSummary
} from './types';

// =====================================================
// RE-EXPORT API FUNCTIONS
// These are pure CRUD operations delegated to the API layer
// =====================================================

export const getImportantDates = importantDatesAPI.getImportantDates;
export const updateImportantDate = importantDatesAPI.updateImportantDate;
export const deleteImportantDate = importantDatesAPI.deleteImportantDate;

// =====================================================
// BUSINESS LOGIC FUNCTIONS
// These provide higher-level operations with business logic
// =====================================================

/**
 * Create a new important date with logging
 */
export async function createImportantDate(input: CreateImportantDateInput): Promise<ImportantDate> {
  const result = await importantDatesAPI.createImportantDate(input);

  logger.info('ImportantDatesService', 'Created important date', {
    personName: input.person_name,
    type: input.date_type
  });

  return result;
}

/**
 * Get upcoming important dates within the specified number of days
 * Business logic: calculates days until, age, and next occurrence
 */
export async function getUpcomingDates(daysAhead = 30): Promise<UpcomingDate[]> {
  const dates = await importantDatesAPI.getImportantDates(true);
  const today = new Date();
  const thisYear = getYear(today);

  const upcoming: UpcomingDate[] = [];

  for (const date of dates) {
    // Create date for this year
    let nextOccurrence = new Date(thisYear, date.month - 1, date.day);

    // If already passed this year, use next year
    if (nextOccurrence < today) {
      nextOccurrence = new Date(thisYear + 1, date.month - 1, date.day);
    }

    const daysUntil = differenceInDays(nextOccurrence, today);

    if (daysUntil <= daysAhead) {
      const age = date.year ? thisYear - date.year + (nextOccurrence.getFullYear() > thisYear ? 1 : 0) : null;

      upcoming.push({
        ...date,
        days_until: daysUntil,
        age,
        next_occurrence: format(nextOccurrence, 'yyyy-MM-dd'),
      });
    }
  }

  // Sort by days until
  return upcoming.sort((a, b) => a.days_until - b.days_until);
}

/**
 * Get dates coming up this week
 */
export async function getDatesThisWeek(): Promise<UpcomingDate[]> {
  return getUpcomingDates(7);
}

/**
 * Get summary of important dates
 * Business logic: aggregates data from the API layer
 */
export async function getDatesSummary(): Promise<DatesSummary> {
  const allDates = await importantDatesAPI.getImportantDates(true);
  const upcomingThisWeek = await getDatesThisWeek();
  const upcomingThisMonth = await getUpcomingDates(30);

  return {
    totalDates: allDates.length,
    upcomingThisWeek,
    upcomingThisMonth,
    byType: {
      birthdays: allDates.filter(d => d.date_type === 'birthday').length,
      anniversaries: allDates.filter(d => d.date_type === 'anniversary').length,
      memorials: allDates.filter(d => d.date_type === 'memorial').length,
      custom: allDates.filter(d => d.date_type === 'custom').length,
    },
  };
}

