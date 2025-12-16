/**
 * ContextAggregator Service
 * Gathers all relevant user data for AI context
 * Provides rich context for smarter AI responses
 */

import { supabase } from '@/lib/supabase';

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
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .or(`due_date.lte.${today}`);

    const allTasks = tasks || [];
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const overdue = allTasks.filter(t => 
      t.due_date && t.due_date < today && t.status !== 'completed'
    ).length;
    const highPriority = allTasks
      .filter(t => t.priority === 'high' && t.status !== 'completed')
      .slice(0, 5);

    return {
      total: allTasks.length,
      completed,
      overdue,
      highPriority,
    };
  }

  private async fetchHabitsContext(userId: string, today: string) {
    const { data: habits } = await supabase
      .from('habits')
      .select('id, name, current_streak')
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: entries } = await supabase
      .from('habit_entries')
      .select('habit_id')
      .eq('date', today);

    const completedIds = new Set((entries || []).map(e => e.habit_id));
    const allHabits = habits || [];
    
    // Streaks at risk: habits with streak > 0 not completed today
    const streaksAtRisk = allHabits
      .filter(h => h.current_streak > 0 && !completedIds.has(h.id))
      .slice(0, 5);

    return {
      due: allHabits.length,
      completed: completedIds.size,
      streaksAtRisk,
    };
  }

  private async fetchEventsContext(userId: string, today: string) {
    const { data: events } = await supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, location')
      .eq('user_id', userId)
      .gte('start_time', `${today}T00:00:00`)
      .lte('start_time', `${today}T23:59:59`)
      .order('start_time');

    return (events || []).slice(0, 10);
  }

  private async fetchFocusContext(userId: string, today: string) {
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('duration')
      .eq('user_id', userId)
      .gte('started_at', `${today}T00:00:00`);

    const allSessions = sessions || [];
    const minutesToday = allSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    return {
      sessionsToday: allSessions.length,
      minutesToday,
      currentStreak: 0, // TODO: Calculate from consecutive days
    };
  }

  private async fetchWellnessContext(userId: string, today: string) {
    const { data: moods } = await supabase
      .from('mood_entries')
      .select('mood, energy')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const { data: journals } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1);

    const latestMood = moods?.[0];

    return {
      latestMood: latestMood?.mood,
      latestEnergy: latestMood?.energy,
      journalEntryToday: (journals?.length || 0) > 0,
    };
  }

  /**
   * Get user patterns from historical data
   */
  async getUserPatterns(userId: string): Promise<UserPatterns> {
    // Get analytics from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analytics } = await supabase
      .from('analytics_daily')
      .select('*')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    const days = analytics || [];

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
      ? moodDays.reduce((sum, d) => sum + d.wellness_mood_avg, 0) / moodDays.length
      : null;

    const energyDays = days.filter(d => d.wellness_energy_avg != null);
    const avgEnergy = energyDays.length > 0
      ? energyDays.reduce((sum, d) => sum + d.wellness_energy_avg, 0) / energyDays.length
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

    // Get upcoming events for next 7 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: upcomingEvents } = await supabase
      .from('calendar_events')
      .select('title, start_time')
      .eq('user_id', userId)
      .gte('start_time', new Date().toISOString())
      .lte('start_time', nextWeek.toISOString())
      .order('start_time')
      .limit(10);

    return {
      today,
      patterns,
      upcomingEvents: (upcomingEvents || []).map(e => ({
        title: e.title,
        date: e.start_time,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const contextAggregator = new ContextAggregator();

// Export type
export type { ContextAggregator };

