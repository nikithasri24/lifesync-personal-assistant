/**
 * Calendar data access helpers shared by API and services
 */

import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../services/types';
import { apiCall, requireAuth } from './apiWrapper';

export async function fetchCalendarEvents(filters?: {
  startDate?: string;
  endDate?: string;
  type?: CalendarEvent['type'];
}): Promise<CalendarEvent[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

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
