/**
 * Calendar data access helpers shared by API and services
 *
 * Merged Mode Support:
 * - If both users have set calendar to "merged", events from both users are shown
 * - RLS policies ensure data security
 */

import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../services/types';
import { apiCall, requireAuth } from './apiWrapper';
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';

// ============================================
// MERGED MODE SUPPORT
// ============================================

// Merged connection cache for Calendar
let cachedMergedConnection: MergedConnectionResult | null | undefined;

/**
 * Get merged connection for calendar module.
 * Returns connection info if both users have enabled merged mode, null otherwise.
 */
export async function getCalendarMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    return cachedMergedConnection;
  }

  cachedMergedConnection = await getMergedConnectionId('calendar');
  return cachedMergedConnection;
}

/**
 * Clear cached merged connection.
 * Call this when connection status changes or user logs out.
 */
export function clearCalendarMergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}

/**
 * Fetch calendar events for current user.
 * In merged mode, fetches both user's and partner's events.
 */
export async function fetchCalendarEvents(filters?: {
  startDate?: string;
  endDate?: string;
  type?: CalendarEvent['type'];
}): Promise<CalendarEvent[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getCalendarMergedConnection();

      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('start_date', { ascending: true });

      // If merged mode enabled, fetch both users' data
      // Otherwise, fetch only current user's data
      if (mergedConnection) {
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      // Apply date filters
      if (filters) {
        if (filters.startDate && filters.endDate) {
          query = query.lte('start_date', filters.endDate).gte('end_date', filters.startDate);
        } else {
          if (filters.startDate) {
            query = query.gte('start_date', filters.startDate);
          }
          if (filters.endDate) {
            query = query.lte('start_date', filters.endDate);
          }
        }
        if (filters.type) {
          query = query.eq('type', filters.type);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CalendarEvent[];
    },
    { domain: 'CalendarAPI', operation: 'getCalendarEvents', data: { filters } }
  );
}
