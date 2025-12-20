/**
 * Analytics API
 * CRUD operations for analytics data with Supabase
 */

import { supabase } from '../lib/supabase';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}

/**
 * Get analytics for a specific date
 */
export async function getAnalyticsForDate(date: string): Promise<AnalyticsDailyData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}

/**
 * Upsert daily analytics
 */
export async function upsertAnalyticsDaily(analytics: AnalyticsDailyData): Promise<AnalyticsDailyData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('analytics_daily')
    .upsert({
      ...analytics,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to upsert analytics');

  return data as AnalyticsDailyData;
}

