/**
 * Important Dates API
 * CRUD operations for birthdays, anniversaries, and special dates
 *
 * This is the ONLY place that should access the important_dates table.
 * Services should use these functions instead of direct Supabase access.
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
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
  return apiCall(
    async () => {
      const user = await requireAuth();

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
      return (data || []) as ImportantDate[];
    },
    { domain: 'ImportantDatesAPI', operation: 'getImportantDates', data: { activeOnly } }
  );
}

/**
 * Create a new important date
 */
export async function createImportantDate(input: CreateImportantDateInput): Promise<ImportantDate> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
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

      const data = handleSupabaseResponse(result, 'Important Date');
      logger.info('ImportantDatesAPI', 'Important date created', { person_name: input.person_name });
      return data as ImportantDate;
    },
    { domain: 'ImportantDatesAPI', operation: 'createImportantDate', data: { person_name: input.person_name } }
  );
}

/**
 * Update an important date
 */
export async function updateImportantDate(
  id: string,
  updates: UpdateImportantDateInput
): Promise<ImportantDate> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('important_dates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Important Date', id);
      logger.info('ImportantDatesAPI', 'Important date updated', { id });
      return data as ImportantDate;
    },
    { domain: 'ImportantDatesAPI', operation: 'updateImportantDate', data: { id } }
  );
}

/**
 * Delete an important date
 */
export async function deleteImportantDate(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('important_dates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      logger.info('ImportantDatesAPI', 'Important date deleted', { id });
    },
    { domain: 'ImportantDatesAPI', operation: 'deleteImportantDate', data: { id } }
  );
}

