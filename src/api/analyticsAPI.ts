/**
 * Analytics API
 * CRUD operations for analytics data with Supabase
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

export interface AnalyticsDailyData {
  id?: string;
  user_id?: string;
  date: string;
  tasks_completed?: number;
  focus_minutes?: number;
  habits_due?: number;
  habits_completed?: number;
  wellness_mood_avg?: number | null;
  wellness_energy_avg?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get daily analytics for a date range
 */
export async function getAnalyticsDaily(filters?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<AnalyticsDailyData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('analytics_daily')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate.toISOString().split('T')[0]);
      }

      if (filters?.endDate) {
        query = query.lte('date', filters.endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AnalyticsDailyData[];
    },
    { domain: 'AnalyticsAPI', operation: 'getAnalyticsDaily', data: { filters } }
  );
}

/**
 * Get analytics for a specific date
 */
export async function getAnalyticsForDate(date: string): Promise<AnalyticsDailyData | null> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('analytics_daily')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data as AnalyticsDailyData;
    },
    { domain: 'AnalyticsAPI', operation: 'getAnalyticsForDate', data: { date } }
  );
}

/**
 * Upsert daily analytics
 */
export async function upsertAnalyticsDaily(analytics: AnalyticsDailyData): Promise<AnalyticsDailyData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('analytics_daily')
        .upsert({
          ...analytics,
          user_id: user.id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Analytics');
      return data as AnalyticsDailyData;
    },
    { domain: 'AnalyticsAPI', operation: 'upsertAnalyticsDaily', data: { date: analytics.date } }
  );
}

