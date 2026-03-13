/**
 * ContextAggregator Service
 * Gathers all relevant user data for AI context
 * Provides rich context for smarter AI responses
 *
 * ARCHITECTURE: Uses cache accessor for data access (benefits from React Query cache)
 */

import { cacheAccessor } from '@/lib/cacheAccessor';
import { getAnalyticsDaily } from '@/api/analyticsAPI';
import { getFinanceAPI } from '@/finance/data';
import { logger } from '@/services/logger';
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

    // Fetch all data in parallel — finance is included so the full context is one round-trip
    const [
      tasksResult,
      habitsResult,
      eventsResult,
      focusResult,
      wellnessResult,
      financeResult,
    ] = await Promise.all([
      this.fetchTasksContext(userId, today),
      this.fetchHabitsContext(userId, today),
      this.fetchEventsContext(userId, today),
      this.fetchFocusContext(userId, today),
      this.fetchWellnessContext(userId, today),
      this.fetchFinanceContext(today),
    ]);

    return {
      tasks: tasksResult,
      habits: habitsResult,
      events: eventsResult,
      focus: focusResult,
      wellness: wellnessResult,
      finance: financeResult,
    };
  }

  private async fetchTasksContext(_userId: string, today: string) {
    // Two focused parallel queries — filters pushed to DB, no JS table scan.
    // Active query: only non-terminal statuses so we can find overdue + high-priority.
    // Done query: count only, no field projection needed beyond status.
    const [activeTasks, doneTasks] = await Promise.all([
      cacheAccessor.getTasks({
        deleted: false,
        archived: false,
        statuses: ['todo', 'in_progress', 'waiting', 'scheduled'],
      }),
      cacheAccessor.getTasks({
        deleted: false,
        archived: false,
        statuses: ['done'],
      }),
    ]);

    // overdue: active tasks whose due_date is before today (string compare is fine for ISO dates)
    const overdue = activeTasks.filter(t => t.due_date && t.due_date < today).length;

    const highPriority = activeTasks
      .filter(t => t.priority === 'high' || t.priority === 'urgent')
      .slice(0, 5)
      .map(t => ({ id: t.id!, title: t.title, due_date: t.due_date || undefined }));

    return {
      total: activeTasks.length + doneTasks.length,
      completed: doneTasks.length,
      overdue,
      highPriority,
    };
  }

  private async fetchHabitsContext(_userId: string, today: string) {
    // Parallel fetch — habits list and today's entries are independent queries.
    const [allHabits, entries] = await Promise.all([
      cacheAccessor.getHabits({ isActive: true }),
      cacheAccessor.getHabitEntriesForDate(today),
    ]);

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

  private async fetchEventsContext(_userId: string, today: string) {
    // Use cache accessor (benefits from React Query cache)
    const events = await cacheAccessor.getCalendarEvents({ startDate: today, endDate: today });

    return events.slice(0, 10).map(e => ({
      id: e.id!,
      title: e.title,
      start_time: e.start_time || '',
      end_time: e.end_time || '',
      location: e.location || undefined,
    }));
  }

  private async fetchFocusContext(_userId: string, today: string) {
    // Use cache accessor (benefits from React Query cache)
    const startDate = today; // API expects string
    const sessions = await cacheAccessor.getFocusSessions({ startDate });

    const minutesToday = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

    return {
      sessionsToday: sessions.length,
      minutesToday,
      currentStreak: 0, // TODO: Calculate from consecutive days
    };
  }

  private async fetchFinanceContext(today: string) {
    const currentMonth = today.slice(0, 7); // YYYY-MM
    const monthStart = `${currentMonth}-01T00:00:00.000Z`;
    const monthEnd = `${today}T23:59:59.999Z`;

    try {
      const api = await getFinanceAPI();
      const [budgets, txns] = await Promise.all([
        api.listBudgets(currentMonth),
        api.listTransactions({ fromISO: monthStart, toISO: monthEnd, type: 'debit', limit: 200 }),
      ]);

      // Sum debit spend per category
      const spendByCat = new Map<string, number>();
      for (const txn of (txns.items ?? [])) {
        if (!txn.categoryId) continue;
        spendByCat.set(txn.categoryId, (spendByCat.get(txn.categoryId) ?? 0) + txn.amount);
      }

      const spendingToday = (txns.items ?? [])
        .filter(t => t.dateISO.startsWith(today))
        .reduce((s, t) => s + t.amount, 0);

      const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
      const totalSpent = budgets.reduce((s, b) => s + (spendByCat.get(b.categoryId) ?? 0), 0);

      return {
        spendingToday: Math.round(spendingToday * 100) / 100,
        budgetRemaining: Math.round((totalBudgeted - totalSpent) * 100) / 100,
      };
    } catch (err) {
      // Finance data is optional — don't let it break the broader context
      logger.warn('ContextAggregator', 'Finance context unavailable', { error: (err as Error).message });
      return { spendingToday: 0, budgetRemaining: 0 };
    }
  }

  private async fetchWellnessContext(_userId: string, today: string) {
    // Use cache accessor (benefits from React Query cache)
    const startDate = new Date(`${today}T00:00:00`);
    const journals = await cacheAccessor.getJournalEntries({ startDate });

    return {
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
        avgEnergy: null,
      };
    }

    const avgTasksPerDay = days.reduce((sum, d) => sum + (d.tasks_completed || 0), 0) / days.length;
    const avgFocusMinutes = days.reduce((sum, d) => sum + (d.focus_minutes || 0), 0) / days.length;

    const habitsDue = days.reduce((sum, d) => sum + (d.habits_due || 0), 0);
    const habitsCompleted = days.reduce((sum, d) => sum + (d.habits_completed || 0), 0);
    const habitCompletionRate = habitsDue > 0 ? habitsCompleted / habitsDue : 0;

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
      avgEnergy,
    };
  }

  /**
   * Get full aggregated context for AI
   */
  async getAggregatedContext(userId: string): Promise<AggregatedContext> {
    const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Fetch context, patterns, and upcoming events in parallel.
    // Upcoming events use a 7-day window so they don't collide with today's
    // events cache key (which uses startDate=endDate=today).
    const [todayContext, patterns, upcomingEvents] = await Promise.all([
      this.getTodaysContext(userId),
      this.getUserPatterns(userId),
      cacheAccessor.getCalendarEvents({ startDate: todayStr, endDate: nextWeek }),
    ]);

    return {
      today: todayContext,
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

