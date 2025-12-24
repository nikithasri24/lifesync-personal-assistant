/**
 * ContextAggregator Service
 * Gathers all relevant user data for AI context
 * Provides rich context for smarter AI responses
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import { getTasks } from '@/api/tasksAPI';
import { getHabits, getHabitEntriesForDate } from '@/api/habitsAPI';
import { getCalendarEvents } from '@/api/calendarAPI';
import { getFocusSessions } from '@/api/focusAPI';
import { getJournalEntries } from '@/api/journalAPI';
import { getAnalyticsDaily } from '@/api/analyticsAPI';
import { format, addDays } from 'date-fns';

export interface TodaysContext {
  // Tasks
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    highPriority: Array<{ id: string; title: string; due_date?: string }>;
  };
  
  // Habits
  habits: {
    due: number;
    completed: number;
    streaksAtRisk: Array<{ id: string; name: string; current_streak: number }>;
  };
  
  // Calendar
  events: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location?: string;
  }>;
  
  // Focus
  focus: {
    sessionsToday: number;
    minutesToday: number;
    currentStreak: number;
  };
  
  // Wellness
  wellness: {
    latestMood?: number;
    latestEnergy?: number;
    journalEntryToday: boolean;
  };
  
  // Finance
  finance: {
    spendingToday: number;
    budgetRemaining: number;
  };
}

export interface UserPatterns {
  // Productivity patterns
  mostProductiveHour: number | null;
  mostProductiveDay: string | null;
  avgTasksPerDay: number;
  avgFocusMinutes: number;
  
  // Habit patterns
  habitCompletionRate: number;
  bestHabitStreak: number;
  
  // Wellness patterns
  avgMood: number | null;
  avgEnergy: number | null;
}

export interface AggregatedContext {
  today: TodaysContext;
  patterns: UserPatterns;
  recentConversationSummary?: string;
  upcomingEvents: Array<{ title: string; date: string }>;
  timestamp: string;
}

class ContextAggregator {
  /**
   * Get today's context for a user
   */
  async getTodaysContext(userId: string): Promise<TodaysContext> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Fetch all data in parallel
    const [
      tasksResult,
      habitsResult,
      eventsResult,
      focusResult,
      wellnessResult,
    ] = await Promise.all([
      this.fetchTasksContext(userId, today),
      this.fetchHabitsContext(userId, today),
      this.fetchEventsContext(userId, today),
      this.fetchFocusContext(userId, today),
      this.fetchWellnessContext(userId, today),
    ]);

    return {
      tasks: tasksResult,
      habits: habitsResult,
      events: eventsResult,
      focus: focusResult,
      wellness: wellnessResult,
      finance: { spendingToday: 0, budgetRemaining: 0 }, // TODO: Implement
    };
  }

  private async fetchTasksContext(userId: string, today: string) {
    // Use API layer instead of direct Supabase
    const allTasks = await getTasks({ deleted: false, archived: false });

    const completed = allTasks.filter(t => t.status === 'done').length;
    const overdue = allTasks.filter(t =>
      t.due_date && t.due_date < today && t.status !== 'done'
    ).length;
    const highPriority = allTasks
      .filter(t => t.priority === 'high' && t.status !== 'done')
      .slice(0, 5)
      .map(t => ({ id: t.id!, title: t.title, due_date: t.due_date || undefined }));

    return {
      total: allTasks.length,
      completed,
      overdue,
      highPriority,
    };
  }

  private async fetchHabitsContext(userId: string, today: string) {
    // Use API layer instead of direct Supabase
    const allHabits = await getHabits({ isActive: true });
    const entries = await getHabitEntriesForDate(today);

    const completedIds = new Set(entries.map(e => e.habit_id));

    // Streaks at risk: habits with streak > 0 not completed today
    const streaksAtRisk = allHabits
      .filter(h => (h.streak_count ?? 0) > 0 && !completedIds.has(h.id!))
      .slice(0, 5)
      .map(h => ({ id: h.id!, name: h.name, current_streak: h.streak_count ?? 0 }));

    return {
      due: allHabits.length,
      completed: completedIds.size,
      streaksAtRisk,
    };
  }

  private async fetchEventsContext(userId: string, today: string) {
    // Use API layer instead of direct Supabase
    const events = await getCalendarEvents({ startDate: today, endDate: today });

    return events.slice(0, 10).map(e => ({
      id: e.id!,
      title: e.title,
      start_time: e.start_time || '',
      end_time: e.end_time || '',
      location: e.location || undefined,
    }));
  }

  private async fetchFocusContext(userId: string, today: string) {
    // Use API layer instead of direct Supabase
    const startDate = today; // API expects string
    const sessions = await getFocusSessions({ startDate });

    const minutesToday = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

    return {
      sessionsToday: sessions.length,
      minutesToday,
      currentStreak: 0, // TODO: Calculate from consecutive days
    };
  }

  private async fetchWellnessContext(userId: string, today: string) {
    // Use API layer instead of direct Supabase
    const startDate = new Date(`${today}T00:00:00`);
    const journals = await getJournalEntries({ startDate });

    // TODO: Add mood tracking API when available
    // For now, return default values
    return {
      latestMood: undefined,
      latestEnergy: undefined,
      journalEntryToday: journals.length > 0,
    };
  }

  /**
   * Get user patterns from historical data
   */
  async getUserPatterns(userId: string): Promise<UserPatterns> {
    // Use API layer instead of direct Supabase
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const days = await getAnalyticsDaily({ startDate: thirtyDaysAgo });

    if (days.length === 0) {
      return {
        mostProductiveHour: null,
        mostProductiveDay: null,
        avgTasksPerDay: 0,
        avgFocusMinutes: 0,
        habitCompletionRate: 0,
        bestHabitStreak: 0,
        avgMood: null,
        avgEnergy: null,
      };
    }

    const avgTasksPerDay = days.reduce((sum, d) => sum + (d.tasks_completed || 0), 0) / days.length;
    const avgFocusMinutes = days.reduce((sum, d) => sum + (d.focus_minutes || 0), 0) / days.length;

    const habitsDue = days.reduce((sum, d) => sum + (d.habits_due || 0), 0);
    const habitsCompleted = days.reduce((sum, d) => sum + (d.habits_completed || 0), 0);
    const habitCompletionRate = habitsDue > 0 ? habitsCompleted / habitsDue : 0;

    const moodDays = days.filter(d => d.wellness_mood_avg != null);
    const avgMood = moodDays.length > 0
      ? moodDays.reduce((sum, d) => sum + (d.wellness_mood_avg || 0), 0) / moodDays.length
      : null;

    const energyDays = days.filter(d => d.wellness_energy_avg != null);
    const avgEnergy = energyDays.length > 0
      ? energyDays.reduce((sum, d) => sum + (d.wellness_energy_avg || 0), 0) / energyDays.length
      : null;

    return {
      mostProductiveHour: null, // TODO: Analyze task completion times
      mostProductiveDay: null, // TODO: Analyze by day of week
      avgTasksPerDay: Math.round(avgTasksPerDay * 10) / 10,
      avgFocusMinutes: Math.round(avgFocusMinutes),
      habitCompletionRate: Math.round(habitCompletionRate * 100),
      bestHabitStreak: 0, // TODO: Query habits table
      avgMood,
      avgEnergy,
    };
  }

  /**
   * Get full aggregated context for AI
   */
  async getAggregatedContext(userId: string): Promise<AggregatedContext> {
    const [today, patterns] = await Promise.all([
      this.getTodaysContext(userId),
      this.getUserPatterns(userId),
    ]);

    // Use API layer instead of direct Supabase
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingEvents = await getCalendarEvents({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(nextWeek, 'yyyy-MM-dd'),
    });

    return {
      today,
      patterns,
      upcomingEvents: upcomingEvents.slice(0, 10).map(e => ({
        title: e.title,
        date: e.start_time || '',
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const contextAggregator = new ContextAggregator();

// Export type
export type { ContextAggregator };

