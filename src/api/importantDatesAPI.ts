/**
 * Important Dates API
 * CRUD operations for birthdays, anniversaries, and special dates
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';

// =====================================================
// TYPES
// =====================================================

export type DateType = 'birthday' | 'anniversary' | 'memorial' | 'holiday' | 'custom';

export interface ImportantDate {
  id: string;
  user_id: string;
  name: string;
  date_type: DateType;
  month: number;
  day: number;
  year?: number;
  person_name?: string;
  relationship?: string;
  reminder_days_before: number[];
  gift_ideas?: string[];
  notes?: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateImportantDateInput {
  name: string;
  date_type: DateType;
  month: number;
  day: number;
  year?: number;
  person_name?: string;
  relationship?: string;
  reminder_days_before?: number[];
  gift_ideas?: string[];
  notes?: string;
  is_recurring?: boolean;
}

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Get all important dates for the current user
 */
export async function getImportantDates(): Promise<ImportantDate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('important_dates')
    .select('*')
    .eq('user_id', user.id)
    .order('month', { ascending: true })
    .order('day', { ascending: true });

  if (error) {
    logger.error('ImportantDatesAPI', 'Failed to get important dates', { error });
    throw error;
  }
  return data as ImportantDate[];
}

/**
 * Get upcoming important dates (next N days)
 */
export async function getUpcomingDates(days: number = 30): Promise<ImportantDate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  // This is a simplified query - in production you'd use a database function
  const { data, error } = await supabase
    .from('important_dates')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    logger.error('ImportantDatesAPI', 'Failed to get upcoming dates', { error });
    throw error;
  }

  // Filter and sort by upcoming
  const upcoming = (data as ImportantDate[]).filter(date => {
    const daysUntil = calculateDaysUntil(date.month, date.day, currentMonth, currentDay);
    return daysUntil >= 0 && daysUntil <= days;
  }).sort((a, b) => {
    const daysA = calculateDaysUntil(a.month, a.day, currentMonth, currentDay);
    const daysB = calculateDaysUntil(b.month, b.day, currentMonth, currentDay);
    return daysA - daysB;
  });

  return upcoming;
}

function calculateDaysUntil(month: number, day: number, currentMonth: number, currentDay: number): number {
  const today = new Date();
  const thisYear = today.getFullYear();
  let targetDate = new Date(thisYear, month - 1, day);
  
  if (targetDate < today) {
    targetDate = new Date(thisYear + 1, month - 1, day);
  }
  
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
      ...input,
      reminder_days_before: input.reminder_days_before || [7, 1],
      is_recurring: input.is_recurring ?? true,
    })
    .select()
    .single();

  if (error) {
    logger.error('ImportantDatesAPI', 'Failed to create important date', { error });
    throw error;
  }
  return data as ImportantDate;
}

/**
 * Update an important date
 */
export async function updateImportantDate(
  id: string,
  updates: Partial<CreateImportantDateInput>
): Promise<ImportantDate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('important_dates')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('ImportantDatesAPI', 'Failed to update important date', { error });
    throw error;
  }
  return data as ImportantDate;
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

  if (error) {
    logger.error('ImportantDatesAPI', 'Failed to delete important date', { error });
    throw error;
  }
}

