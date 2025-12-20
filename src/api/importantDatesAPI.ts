/**
 * Important Dates API
 * CRUD operations for birthdays, anniversaries, and special dates
 *
 * This is the ONLY place that should access the important_dates table.
 * Services should use these functions instead of direct Supabase access.
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';
import type {
  ImportantDate,
  CreateImportantDateInput,
  UpdateImportantDateInput
} from '../services/dates/types';

// Re-export types for convenience
export type {
  ImportantDate,
  UpcomingDate,
  CreateImportantDateInput,
  UpdateImportantDateInput,
  DateType,
  DatesSummary
} from '../services/dates/types';

// =====================================================
// CRUD OPERATIONS
// =====================================================

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
  if (error) {
    logger.error('ImportantDatesAPI', 'Failed to get important dates', { error });
    throw error;
  }
  return (data || []) as ImportantDate[];
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
  updates: UpdateImportantDateInput
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

