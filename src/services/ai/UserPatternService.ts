/**
 * User Pattern Service
 * Analyzes historical data to identify recurring patterns in user behavior
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { format, subDays, getDay, getHours, parseISO } from 'date-fns';

export interface TimePattern {
  hour: number;
  count: number;
  percentage: number;
}

export interface DayPattern {
  day: string; // 'Monday', 'Tuesday', etc.
  dayIndex: number; // 0-6
  count: number;
  percentage: number;
}

export interface HabitPattern {
  habitId: string;
  habitName: string;
  preferredDays: string[];
  preferredTime?: string;
  averageStreak: number;
  completionRate: number;
}

export interface SpendingPattern {
  highSpendingDays: string[];
  averageWeekdaySpending: number;
  averageWeekendSpending: number;
  topCategories: { category: string; amount: number }[];
}

export interface ProductivityPattern {
  peakHours: TimePattern[];
  peakDays: DayPattern[];
  averageTasksPerDay: number;
  averageFocusMinutes: number;
  taskCompletionRate: number;
}

export interface UserPatternAnalysis {
  productivity: ProductivityPattern;
  habits: HabitPattern[];
  spending: SpendingPattern;
  insights: string[];
  analyzedDays: number;
  lastUpdated: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

class UserPatternService {
  /**
   * Analyze task completion patterns
   */
  async analyzeProductivityPatterns(userId: string, days = 30): Promise<ProductivityPattern> {
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    // Get completed tasks with completion time
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, completed_at, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', startDate)
      .not('completed_at', 'is', null);

    // Get focus sessions
    const { data: focusSessions } = await supabase
      .from('focus_sessions')
      .select('started_at, duration')
      .eq('user_id', userId)
      .gte('started_at', startDate);

    // Analyze hour patterns
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    
    (tasks || []).forEach(task => {
      if (task.completed_at) {
        const date = parseISO(task.completed_at);
        const hour = getHours(date);
        const day = getDay(date);
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    });

    const totalTasks = tasks?.length || 0;
    
    // Convert to patterns
    const peakHours: TimePattern[] = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const peakDays: DayPattern[] = Object.entries(dayCounts)
      .map(([dayIndex, count]) => ({
        day: DAY_NAMES[parseInt(dayIndex)],
        dayIndex: parseInt(dayIndex),
        count,
        percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate averages
    const focusMinutes = (focusSessions || []).reduce((sum, s) => sum + (s.duration || 0), 0);
    
    // Get total tasks created in period
    const { count: totalCreated } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startDate);

    return {
      peakHours,
      peakDays,
      averageTasksPerDay: Math.round((totalTasks / days) * 10) / 10,
      averageFocusMinutes: Math.round(focusMinutes / days),
      taskCompletionRate: totalCreated ? Math.round((totalTasks / totalCreated) * 100) : 0,
    };
  }

  /**
   * Analyze habit patterns
   */
  async analyzeHabitPatterns(userId: string, days = 30): Promise<HabitPattern[]> {
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    // Get habits
    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, current_streak')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!habits || habits.length === 0) return [];

    // Get habit entries
    const { data: entries } = await supabase
      .from('habit_entries')
      .select('habit_id, date, completed_at')
      .in('habit_id', habits.map(h => h.id))
      .gte('date', startDate);

    const patterns: HabitPattern[] = habits.map(habit => {
      const habitEntries = (entries || []).filter(e => e.habit_id === habit.id);
      
      // Analyze preferred days
      const dayCount: Record<number, number> = {};
      habitEntries.forEach(entry => {
        const day = getDay(parseISO(entry.date));
        dayCount[day] = (dayCount[day] || 0) + 1;
      });

      const preferredDays = Object.entries(dayCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([dayIndex]) => DAY_NAMES[parseInt(dayIndex)]);

      return {
        habitId: habit.id,
        habitName: habit.name,
        preferredDays,
        averageStreak: habit.current_streak || 0,
        completionRate: Math.round((habitEntries.length / days) * 100),
      };
    });

    return patterns;
  }

  /**
   * Analyze spending patterns
   */
  async analyzeSpendingPatterns(userId: string, days = 30): Promise<SpendingPattern> {
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    // Get transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, category, date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', startDate);

    if (!transactions || transactions.length === 0) {
      return {
        highSpendingDays: [],
        averageWeekdaySpending: 0,
        averageWeekendSpending: 0,
        topCategories: [],
      };
    }

    // Analyze by day of week
    const daySpending: Record<number, number[]> = {};
    const categorySpending: Record<string, number> = {};

    transactions.forEach(t => {
      const day = getDay(parseISO(t.date));
      if (!daySpending[day]) daySpending[day] = [];
      daySpending[day].push(t.amount);

      const category = t.category || 'other';
      categorySpending[category] = (categorySpending[category] || 0) + t.amount;
    });

    // Calculate weekday vs weekend
    let weekdayTotal = 0, weekdayCount = 0;
    let weekendTotal = 0, weekendCount = 0;

    Object.entries(daySpending).forEach(([dayIndex, amounts]) => {
      const total = amounts.reduce((sum, a) => sum + a, 0);
      if (parseInt(dayIndex) === 0 || parseInt(dayIndex) === 6) {
        weekendTotal += total;
        weekendCount += amounts.length;
      } else {
        weekdayTotal += total;
        weekdayCount += amounts.length;
      }
    });

    // Find high spending days
    const avgByDay = Object.entries(daySpending).map(([dayIndex, amounts]) => ({
      day: DAY_NAMES[parseInt(dayIndex)],
      avg: amounts.reduce((sum, a) => sum + a, 0) / amounts.length,
    }));
    const overallAvg = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;
    const highSpendingDays = avgByDay
      .filter(d => d.avg > overallAvg * 1.3)
      .map(d => d.day);

    // Top categories
    const topCategories = Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      highSpendingDays,
      averageWeekdaySpending: weekdayCount > 0 ? Math.round(weekdayTotal / weekdayCount) : 0,
      averageWeekendSpending: weekendCount > 0 ? Math.round(weekendTotal / weekendCount) : 0,
      topCategories,
    };
  }

  /**
   * Generate natural language insights from patterns
   */
  generateInsights(
    productivity: ProductivityPattern,
    habits: HabitPattern[],
    spending: SpendingPattern
  ): string[] {
    const insights: string[] = [];

    // Productivity insights
    if (productivity.peakHours.length > 0) {
      const peakHour = productivity.peakHours[0].hour;
      const timeStr = peakHour < 12 ? `${peakHour}am` : peakHour === 12 ? '12pm' : `${peakHour - 12}pm`;
      insights.push(`You're most productive around ${timeStr}`);
    }

    if (productivity.peakDays.length > 0) {
      insights.push(`${productivity.peakDays[0].day} is your most productive day`);
    }

    if (productivity.taskCompletionRate > 80) {
      insights.push(`Great task completion rate: ${productivity.taskCompletionRate}%`);
    } else if (productivity.taskCompletionRate < 50) {
      insights.push(`Consider breaking down tasks - completion rate is ${productivity.taskCompletionRate}%`);
    }

    // Habit insights
    const strongHabits = habits.filter(h => h.completionRate > 70);
    if (strongHabits.length > 0) {
      insights.push(`Strong consistency with: ${strongHabits.map(h => h.habitName).join(', ')}`);
    }

    const strugglingHabits = habits.filter(h => h.completionRate < 30 && h.completionRate > 0);
    if (strugglingHabits.length > 0) {
      insights.push(`Consider adjusting: ${strugglingHabits.map(h => h.habitName).join(', ')}`);
    }

    // Spending insights
    if (spending.averageWeekendSpending > spending.averageWeekdaySpending * 1.5) {
      insights.push('You tend to spend more on weekends');
    }

    if (spending.highSpendingDays.length > 0) {
      insights.push(`Higher spending on: ${spending.highSpendingDays.join(', ')}`);
    }

    return insights;
  }

  /**
   * Get full pattern analysis
   */
  async getFullAnalysis(userId: string, days = 30): Promise<UserPatternAnalysis> {
    logger.info('UserPatternService', 'Starting pattern analysis', { userId, days });

    const [productivity, habits, spending] = await Promise.all([
      this.analyzeProductivityPatterns(userId, days),
      this.analyzeHabitPatterns(userId, days),
      this.analyzeSpendingPatterns(userId, days),
    ]);

    const insights = this.generateInsights(productivity, habits, spending);

    return {
      productivity,
      habits,
      spending,
      insights,
      analyzedDays: days,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const userPatternService = new UserPatternService();

