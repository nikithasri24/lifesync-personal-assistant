/**
 * useImportantDateReminders Hook
 * Schedules reminders for upcoming birthdays, anniversaries, and other important dates
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getImportantDates } from '@/api/importantDatesAPI';
import { queryKeys } from '@/lib/react-query';
import { reminderService } from '@/services/reminders';
import type { ImportantDate } from '@/services/dates/types';
import { addDays, setMonth, setDate, isAfter, isBefore, startOfDay, differenceInDays, getYear, addYears } from 'date-fns';
import { logger } from '@/services/logger';

/**
 * Get active important dates using the API layer
 */
async function getActiveImportantDates(): Promise<ImportantDate[]> {
  try {
    return await getImportantDates(true);
  } catch (error) {
    logger.error('Hooks', 'Error fetching important dates', { error });
    return [];
  }
}

/**
 * Calculate the next occurrence of an important date
 */
function getNextOccurrence(date: ImportantDate): Date {
  const today = startOfDay(new Date());
  const currentYear = getYear(today);
  
  // Create date for this year
  let nextDate = setDate(setMonth(new Date(currentYear, 0, 1), date.month - 1), date.day);
  
  // If the date has already passed this year, use next year
  if (isBefore(nextDate, today)) {
    nextDate = addYears(nextDate, 1);
  }
  
  return nextDate;
}

/**
 * Get emoji for date type
 */
function getDateTypeEmoji(dateType: string): string {
  switch (dateType) {
    case 'birthday':
      return '🎂';
    case 'anniversary':
      return '💍';
    case 'memorial':
      return '🕯️';
    default:
      return '📅';
  }
}

/**
 * Get label for date type
 */
function getDateTypeLabel(dateType: string): string {
  switch (dateType) {
    case 'birthday':
      return 'Birthday';
    case 'anniversary':
      return 'Anniversary';
    case 'memorial':
      return 'Memorial';
    default:
      return 'Special Date';
  }
}

/**
 * Hook to schedule important date reminders
 */
export function useImportantDateReminders(enabled: boolean = true) {
  const scheduledRef = useRef<Set<string>>(new Set());
  const lastScheduleDateRef = useRef<string>('');

  const { data: dates } = useQuery({
    queryKey: [...queryKeys.importantDates.all, 'with-reminders'],
    queryFn: getActiveImportantDates,
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 6 * 60 * 60 * 1000, // Refetch every 6 hours
  });

  useEffect(() => {
    if (!enabled || !dates || dates.length === 0) return;

    const today = startOfDay(new Date()).toISOString();
    
    // Reset scheduled set if it's a new day
    if (lastScheduleDateRef.current !== today) {
      scheduledRef.current.clear();
      lastScheduleDateRef.current = today;
    }

    const scheduleReminders = async () => {
      const now = new Date();

      for (const date of dates) {
        const nextOccurrence = getNextOccurrence(date);
        const reminderDays = date.reminder_days_before || [7, 1];
        const emoji = getDateTypeEmoji(date.date_type);
        const label = getDateTypeLabel(date.date_type);
        
        // Calculate age if year is provided
        let ageText = '';
        if (date.year && date.date_type === 'birthday') {
          const age = getYear(nextOccurrence) - date.year;
          ageText = ` (turning ${age})`;
        } else if (date.year && date.date_type === 'anniversary') {
          const years = getYear(nextOccurrence) - date.year;
          ageText = ` (${years} years)`;
        }
        
        for (const daysBefore of reminderDays) {
          const reminderKey = `${date.id}-${daysBefore}`;
          if (scheduledRef.current.has(reminderKey)) continue;

          const reminderDate = addDays(nextOccurrence, -daysBefore);
          
          // Only schedule if reminder date is today or in the future (within 14 days)
          if (isAfter(reminderDate, now) && differenceInDays(reminderDate, now) <= 14) {
            try {
              const daysText = daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`;
              await reminderService.scheduleReminder({
                type: 'custom',
                title: `${emoji} ${label} ${daysText}`,
                body: `${date.person_name}'s ${label.toLowerCase()}${ageText}${date.relationship ? ` (${date.relationship})` : ''}`,
                scheduledFor: reminderDate,
                priority: daysBefore === 1 ? 'high' : 'normal',
                entityType: 'important_date',
                entityId: date.id,
              });
              scheduledRef.current.add(reminderKey);
            } catch (error) {
              logger.error('Hooks', `Failed to schedule reminder for ${date.person_name}`, { error });
            }
          }
        }
      }
    };

    scheduleReminders();
  }, [enabled, dates]);
}

