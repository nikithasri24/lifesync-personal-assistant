/**
 * Analytics API
 * CRUD operations for analytics data with Supabase
 * Centralized data access for all analytics queries
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

// =====================================================
// RAW DATA QUERIES FOR ANALYTICS AGGREGATION
// =====================================================

export interface DateRange {
  startDate: string;
  endDate: string;
  [key: string]: string; // Index signature for apiCall compatibility
}

/**
 * Get tasks for analytics aggregation
 */
export async function getTasksForAnalytics(dateRange: DateRange): Promise<Array<{
  status: string;
  completed_at: string | null;
  created_at: string;
}>> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('tasks')
        .select('status, completed_at, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);

      if (error) throw error;
      return data ?? [];
    },
    { domain: 'AnalyticsAPI', operation: 'getTasksForAnalytics', data: dateRange }
  );
}

/**
 * Get habit entries for analytics aggregation
 */
export async function getHabitEntriesForAnalytics(dateRange: DateRange): Promise<Array<{
  id: string;
  habit_id: string;
  date: string;
}>> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // First get all user's habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id);

      if (habitsError) throw habitsError;

      const habitIds = habits?.map(h => h.id) || [];
      if (habitIds.length === 0) return [];

      const { data, error } = await supabase
        .from('habit_entries')
        .select('id, habit_id, date')
        .in('habit_id', habitIds)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (error) throw error;
      return data ?? [];
    },
    { domain: 'AnalyticsAPI', operation: 'getHabitEntriesForAnalytics', data: dateRange }
  );
}

/**
 * Get habits count for analytics
 */
export async function getHabitsCount(): Promise<number> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { count, error } = await supabase
        .from('habits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      return count ?? 0;
    },
    { domain: 'AnalyticsAPI', operation: 'getHabitsCount' }
  );
}

/**
 * Get focus sessions for analytics
 */
export async function getFocusSessionsForAnalytics(dateRange: DateRange): Promise<Array<{
  duration_minutes: number;
  actual_duration_seconds: number | null;
  status: string;
}>> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('duration_minutes, actual_duration_seconds, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('started_at', dateRange.startDate)
        .lte('started_at', dateRange.endDate);

      if (error) throw error;
      return data ?? [];
    },
    { domain: 'AnalyticsAPI', operation: 'getFocusSessionsForAnalytics', data: dateRange }
  );
}

/**
 * Get journal entries for analytics
 */
export async function getJournalEntriesForAnalytics(dateRange: DateRange): Promise<Array<{
  id: string;
  date: string;
  mood: string | number | null;
  created_at: string;
}>> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, date, mood, created_at')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    { domain: 'AnalyticsAPI', operation: 'getJournalEntriesForAnalytics', data: dateRange }
  );
}

/**
 * Get projects for analytics
 */
export async function getProjectsForAnalytics(dateRange: DateRange): Promise<Array<{
  id: string;
  progress: number;
  updated_at: string;
}>> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('projects')
        .select('id, progress, updated_at')
        .eq('user_id', user.id)
        .gte('updated_at', dateRange.startDate)
        .lte('updated_at', dateRange.endDate);

      if (error) throw error;
      return data ?? [];
    },
    { domain: 'AnalyticsAPI', operation: 'getProjectsForAnalytics', data: dateRange }
  );
}

/**
 * Get transactions for analytics
 */
export async function getTransactionsForAnalytics(dateRange: DateRange): Promise<Array<{
  type: string;
  amount: number;
  category_name: string | null;
}>> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('finance_transactions')
        .select('type, amount, finance_categories(name)')
        .eq('user_id', user.id)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (error) throw error;

      return (data ?? []).map(t => ({
        type: t.type,
        amount: t.amount,
        category_name: (t.finance_categories as { name?: string } | null)?.name ?? null,
      }));
    },
    { domain: 'AnalyticsAPI', operation: 'getTransactionsForAnalytics', data: dateRange }
  );
}

/**
 * Get budgets total for analytics
 */
export async function getBudgetsTotalForAnalytics(): Promise<number> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('finance_budgets')
        .select('amount')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data ?? []).reduce((sum, b) => sum + (b.amount ?? 0), 0);
    },
    { domain: 'AnalyticsAPI', operation: 'getBudgetsTotalForAnalytics' }
  );
}
