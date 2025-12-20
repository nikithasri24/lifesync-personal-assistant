/**
 * Important Dates Service
 * Manages birthdays, anniversaries, and other important dates
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { addDays, format, parseISO, differenceInDays, getYear, setYear } from 'date-fns';
import type { 
  ImportantDate, UpcomingDate, CreateImportantDateInput, 
  UpdateImportantDateInput, DatesSummary 
} from './types';

/**
 * Get all important dates for the current user
 */
export async function getImportantDates(activeOnly = true): Promise<ImportantDate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('important_dates')
    .select('*')
    .eq('user_id', user.id)
    .order('month', { ascending: true })
    .order('day', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get upcoming important dates within the specified number of days
 */
export async function getUpcomingDates(daysAhead = 30): Promise<UpcomingDate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const dates = await getImportantDates(true);
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
 * Create a new important date
 */
export async function createImportantDate(input: CreateImportantDateInput): Promise<ImportantDate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('important_dates')
    .insert({
      user_id: user.id,
      person_name: input.person_name,
      relationship: input.relationship,
      date_type: input.date_type,
      month: input.month,
      day: input.day,
      year: input.year,
      reminder_days_before: input.reminder_days_before || [7, 1],
      notes: input.notes,
      gift_ideas: input.gift_ideas,
      celebration_notes: input.celebration_notes,
    })
    .select()
    .single();

  if (error) throw error;
  
  logger.info('ImportantDatesService', 'Created important date', { 
    personName: input.person_name, 
    type: input.date_type 
  });
  
  return data;
}

/**
 * Update an important date
 */
export async function updateImportantDate(
  id: string, 
  input: UpdateImportantDateInput
): Promise<ImportantDate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('important_dates')
    .update(input)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an important date
 */
export async function deleteImportantDate(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('important_dates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Get summary of important dates
 */
export async function getDatesSummary(): Promise<DatesSummary> {
  const allDates = await getImportantDates(true);
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

