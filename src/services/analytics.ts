/**
 * Analytics Service
 * Aggregates data from multiple features to provide insights
 * Uses API layer for all database access
 */

import {
  getTasksForAnalytics,
  getHabitEntriesForAnalytics,
  getHabitsCount,
  getFocusSessionsForAnalytics,
  getJournalEntriesForAnalytics,
  getProjectsForAnalytics,
  getTransactionsForAnalytics,
  getBudgetsTotalForAnalytics,
  type DateRange,
} from '../api/analyticsAPI';
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
export async function getProductivityAnalytics(dateRange: DateRange): Promise<ProductivityAnalytics> {
  try {
    // Fetch all data in parallel using API layer
    const [tasks, habitEntries, habitsTotal, focusSessions, journalEntries, projects] = await Promise.all([
      getTasksForAnalytics(dateRange),
      getHabitEntriesForAnalytics(dateRange),
      getHabitsCount(),
      getFocusSessionsForAnalytics(dateRange),
      getJournalEntriesForAnalytics(dateRange),
      getProjectsForAnalytics(dateRange),
    ]);

    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter(
      (t) =>
        t.status === 'done' &&
        t.completed_at &&
        t.completed_at >= dateRange.startDate &&
        t.completed_at <= dateRange.endDate
    ).length;

    const habitsCompleted = habitEntries.length;

    const focusMinutes = focusSessions.reduce(
      (sum, s) => sum + (s.actual_duration_seconds ? s.actual_duration_seconds / 60 : s.duration_minutes),
      0
    );

    const projectsProgressed = projects.filter((p) => p.progress > 0).length;

    // Calculate productivity score (0-100)
    const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 30 : 0;
    const habitScore = habitsTotal > 0 ? Math.min((habitsCompleted / (habitsTotal * 7)) * 30, 30) : 0;
    const focusScore = Math.min((focusMinutes / 120) * 20, 20);
    const journalScore = Math.min((journalEntries.length / 7) * 20, 20);

    const productivityScore = Math.round(taskScore + habitScore + focusScore + journalScore);

    return {
      tasksCompleted,
      tasksTotal,
      habitsCompleted,
      habitsTotal,
      focusMinutes: Math.round(focusMinutes),
      journalEntries: journalEntries.length,
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
export async function getFinanceAnalytics(dateRange: DateRange): Promise<FinanceAnalytics> {
  try {
    // Fetch data in parallel using API layer
    const [transactions, totalBudget] = await Promise.all([
      getTransactionsForAnalytics(dateRange),
      getBudgetsTotalForAnalytics(),
    ]);

    const totalSpending = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const spendingByCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const category = t.category_name || 'Uncategorized';
        spendingByCategory[category] = (spendingByCategory[category] || 0) + t.amount;
      });

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
export async function getWellbeingAnalytics(dateRange: DateRange): Promise<WellbeingAnalytics> {
  try {
    // Fetch journal entries using API layer
    const journalEntries = await getJournalEntriesForAnalytics(dateRange);

    // Filter entries with mood
    const entriesWithMood = journalEntries.filter(e => e.mood !== null);

    // Calculate average mood (assuming mood is 1-5)
    const moodValues = entriesWithMood.map((e) => {
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
      return moodMap[String(mood).toLowerCase()] || 3;
    });

    const averageMood =
      moodValues.length > 0
        ? moodValues.reduce((sum, m) => sum + m, 0) / moodValues.length
        : 3;

    // Build mood trend
    const moodTrend = entriesWithMood.map((e) => ({
      date: e.date,
      mood: typeof e.mood === 'number' ? e.mood : 3,
    }));

    // Calculate wellbeing score
    const moodScore = (averageMood / 5) * 50;
    const journalScore = Math.min((entriesWithMood.length / 7) * 50, 50);
    const wellbeingScore = Math.round(moodScore + journalScore);

    // Calculate journal streak
    const journalStreak = calculateJournalStreak(entriesWithMood.map((e) => e.date));

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
