/**
 * Analytics Service
 * Aggregates data from multiple features to provide insights
 */

import { supabase } from '../lib/supabase';
import { logger } from './logger';

export interface ProductivityAnalytics {
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  focusMinutes: number;
  journalEntries: number;
  projectsProgressed: number;
  productivityScore: number; // 0-100
}

export interface FinanceAnalytics {
  totalSpending: number;
  totalIncome: number;
  spendingByCategory: Record<string, number>;
  budgetCompliance: number; // percentage
  netSavings: number;
}

export interface WellbeingAnalytics {
  averageMood: number;
  moodTrend: Array<{ date: string; mood: number }>;
  wellbeingScore: number; // 0-100
  journalStreak: number;
}

/**
 * Get productivity analytics for a date range
 */
export async function getProductivityAnalytics(dateRange: {
  startDate: string;
  endDate: string;
}): Promise<ProductivityAnalytics> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch tasks data
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, completed_at')
      .eq('user_id', user.id)
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);

    const tasksTotal = tasks?.length || 0;
    const tasksCompleted =
      tasks?.filter(
        (t) =>
          t.status === 'done' &&
          t.completed_at &&
          t.completed_at >= dateRange.startDate &&
          t.completed_at <= dateRange.endDate
      ).length || 0;

    // Fetch habits data
    const { data: habits } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', user.id);

    const { data: habitEntries } = await supabase
      .from('habit_entries')
      .select('*')
      .in('habit_id', habits?.map((h) => h.id) || [])
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);

    const habitsTotal = habits?.length || 0;
    const habitsCompleted = habitEntries?.length || 0;

    // Fetch focus sessions
    const { data: focusSessions } = await supabase
      .from('focus_sessions')
      .select('duration_minutes, actual_duration_seconds, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('started_at', dateRange.startDate)
      .lte('started_at', dateRange.endDate);

    const focusMinutes =
      focusSessions?.reduce(
        (sum, s) => sum + (s.actual_duration_seconds ? s.actual_duration_seconds / 60 : s.duration_minutes),
        0
      ) || 0;

    // Fetch journal entries
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', dateRange.startDate)
      .lte('created_at', dateRange.endDate);

    // Fetch projects with progress
    const { data: projects } = await supabase
      .from('projects')
      .select('progress, updated_at')
      .eq('user_id', user.id)
      .gte('updated_at', dateRange.startDate)
      .lte('updated_at', dateRange.endDate);

    const projectsProgressed = projects?.filter((p) => p.progress > 0).length || 0;

    // Calculate productivity score (0-100)
    const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 30 : 0;
    const habitScore = habitsTotal > 0 ? Math.min((habitsCompleted / (habitsTotal * 7)) * 30, 30) : 0; // assume weekly target
    const focusScore = Math.min((focusMinutes / 120) * 20, 20); // 120 min = max score
    const journalScore = Math.min((journalEntries?.length || 0) / 7 * 20, 20); // 7 entries = max score

    const productivityScore = Math.round(taskScore + habitScore + focusScore + journalScore);

    return {
      tasksCompleted,
      tasksTotal,
      habitsCompleted,
      habitsTotal,
      focusMinutes: Math.round(focusMinutes),
      journalEntries: journalEntries?.length || 0,
      projectsProgressed,
      productivityScore,
    };
  } catch (error) {
    logger.error('Analytics', 'Operation failed', { error, context: 'getProductivityAnalytics' });
    throw error;
  }
}

/**
 * Get finance analytics for a date range
 */
export async function getFinanceAnalytics(dateRange: {
  startDate: string;
  endDate: string;
}): Promise<FinanceAnalytics> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('type, amount, category_id, categories(name)')
      .eq('user_id', user.id)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate);

    const totalSpending =
      transactions
        ?.filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    const totalIncome =
      transactions
        ?.filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    // Group by category
    const spendingByCategory: Record<string, number> = {};
    transactions
      ?.filter((t) => t.type === 'expense')
      .forEach((t) => {
        const category = (t.categories as { name?: string } | null)?.name || 'Uncategorized';
        spendingByCategory[category] = (spendingByCategory[category] || 0) + t.amount;
      });

    // Calculate budget compliance (simplified)
    const { data: budgets } = await supabase
      .from('budgets')
      .select('amount')
      .eq('user_id', user.id);

    const totalBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;
    const budgetCompliance = totalBudget > 0 ? Math.max(0, (1 - totalSpending / totalBudget) * 100) : 100;

    return {
      totalSpending,
      totalIncome,
      spendingByCategory,
      budgetCompliance: Math.round(budgetCompliance),
      netSavings: totalIncome - totalSpending,
    };
  } catch (error) {
    logger.error('Analytics', 'Operation failed', { error, context: 'getFinanceAnalytics' });
    throw error;
  }
}

/**
 * Get wellbeing analytics for a date range
 */
export async function getWellbeingAnalytics(dateRange: {
  startDate: string;
  endDate: string;
}): Promise<WellbeingAnalytics> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch journal entries with moods
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('date, mood')
      .eq('user_id', user.id)
      .gte('date', dateRange.startDate)
      .lte('date', dateRange.endDate)
      .not('mood', 'is', null)
      .order('date', { ascending: true });

    // Calculate average mood (assuming mood is 1-5)
    const moodValues = journalEntries?.map((e) => {
      const mood = e.mood;
      if (typeof mood === 'number') return mood;
      // Map string moods to numbers
      const moodMap: Record<string, number> = {
        terrible: 1,
        bad: 2,
        okay: 3,
        good: 4,
        great: 5,
      };
      return moodMap[mood?.toLowerCase() || ''] || 3;
    }) || [];

    const averageMood =
      moodValues.length > 0
        ? moodValues.reduce((sum, m) => sum + m, 0) / moodValues.length
        : 3;

    // Build mood trend
    const moodTrend =
      journalEntries?.map((e) => ({
        date: e.date,
        mood: typeof e.mood === 'number' ? e.mood : 3,
      })) || [];

    // Calculate wellbeing score
    const moodScore = (averageMood / 5) * 50; // 50% from mood
    const journalScore = Math.min((journalEntries?.length || 0) / 7 * 50, 50); // 50% from journal consistency
    const wellbeingScore = Math.round(moodScore + journalScore);

    // Calculate journal streak
    const journalStreak = calculateJournalStreak(journalEntries?.map((e) => e.date) || []);

    return {
      averageMood: Math.round(averageMood * 10) / 10,
      moodTrend,
      wellbeingScore,
      journalStreak,
    };
  } catch (error) {
    logger.error('Analytics', 'Operation failed', { error, context: 'getWellbeingAnalytics' });
    throw error;
  }
}

// Helper to calculate journal streak
function calculateJournalStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = [...dates].sort().reverse();
  let streak = 1;
  const today = new Date().toISOString().split('T')[0];

  // Check if there's an entry today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== getPreviousDate(today)) {
    return 0;
  }

  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = sortedDates[i];
    const previousDate = sortedDates[i - 1];

    if (currentDate === getPreviousDate(previousDate)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getPreviousDate(dateString: string): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Get weekly report
 */
export async function getWeeklyReport(): Promise<{
  productivity: ProductivityAnalytics;
  finance: FinanceAnalytics;
  wellbeing: WellbeingAnalytics;
}> {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const dateRange = {
    startDate: weekAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };

  const [productivity, finance, wellbeing] = await Promise.all([
    getProductivityAnalytics(dateRange),
    getFinanceAnalytics(dateRange),
    getWellbeingAnalytics(dateRange),
  ]);

  return { productivity, finance, wellbeing };
}

/**
 * Get monthly report
 */
export async function getMonthlyReport(): Promise<{
  productivity: ProductivityAnalytics;
  finance: FinanceAnalytics;
  wellbeing: WellbeingAnalytics;
}> {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const dateRange = {
    startDate: monthAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };

  const [productivity, finance, wellbeing] = await Promise.all([
    getProductivityAnalytics(dateRange),
    getFinanceAnalytics(dateRange),
    getWellbeingAnalytics(dateRange),
  ]);

  return { productivity, finance, wellbeing };
}
