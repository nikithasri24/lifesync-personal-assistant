/**
 * Dashboard AI Tools
 *
 * AI tools for dashboard summary and quick stats
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import { getTasks } from '@/api/tasksAPI';
import { getHabits, getHabitEntriesForHabit } from '@/api/habitsAPI';
import { getNotes } from '@/api/notesAPI';
import { getJournalEntries } from '@/api/journalAPI';
import { getUserLifeGoals } from '@/goals/api/lifeGoalsAPI';
import { logger } from '@/services/logger';
import { isToday, addDays, startOfDay } from 'date-fns';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const getDashboardSummaryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_dashboard_summary',
    description: 'Get a comprehensive dashboard summary including tasks, habits, goals, notes, and journal entries. No parameters required.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
};

const getQuickStatsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_quick_stats',
    description: 'Get quick statistics for today. Returns counts of today\'s tasks, habits to complete, and other key metrics. No parameters required.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
};

const getRecentActivityDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_recent_activity',
    description: 'Get recent activity across all features (tasks completed, habits logged, notes created, journal entries). Optional: days (number) - how many days of history to include, defaults to 7.',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days of history to include - optional, defaults to 7'
        }
      }
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Check if habit was completed today
 */
async function wasHabitCompletedToday(habitId: string): Promise<boolean> {
  try {
    const entries = await getHabitEntriesForHabit(habitId);
    const today = startOfDay(new Date()).toISOString().split('T')[0];
    return entries.some(entry => entry.date === today);
  } catch (error) {
    logger.error('DashboardTools', 'Operation failed', { error,
      context: 'wasHabitCompletedToday',
      habitId
    });
    return false;
  }
}

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Get dashboard summary
 */
async function executeGetDashboardSummary(
  _args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    logger.info('DashboardTools', 'Getting dashboard summary');

    // Fetch all data in parallel
    const [tasks, habits, notes, journalEntries, goals] = await Promise.all([
      getTasks(),
      getHabits({ isActive: true }),
      getNotes(),
      getJournalEntries(),
      getUserLifeGoals()
    ]);

    // Today's tasks
    const todayTasks = tasks.filter(task =>
      task.status !== 'done' &&
      !task.deleted &&
      task.due_date &&
      isToday(new Date(task.due_date))
    );

    // Upcoming tasks (next 7 days)
    const upcomingTasks = tasks.filter(task =>
      task.status !== 'done' &&
      !task.deleted &&
      task.due_date &&
      new Date(task.due_date) > new Date() &&
      new Date(task.due_date) <= addDays(new Date(), 7)
    );

    // Overdue tasks
    const overdueTasks = tasks.filter(task =>
      task.status !== 'done' &&
      !task.deleted &&
      task.due_date &&
      new Date(task.due_date) < startOfDay(new Date())
    );

    // Completed tasks today
    const completedToday = tasks.filter(task =>
      task.status === 'done' &&
      task.updated_at &&
      isToday(new Date(task.updated_at))
    );

    // Check habits completed today
    const habitsCompletedToday: typeof habits = [];
    for (const habit of habits) {
      if (habit.id && await wasHabitCompletedToday(habit.id)) {
        habitsCompletedToday.push(habit);
      }
    }

    // Active goals (in-progress or not-started)
    const activeGoals = goals.filter(goal => goal.status === 'in-progress' || goal.status === 'not-started');

    // Recent notes (last 5)
    const recentNotes = notes.slice(0, 5);

    // Recent journal entries (last 3)
    const recentJournal = journalEntries.slice(0, 3);

    logger.info('DashboardTools', 'Dashboard summary generated', {
      todayTasksCount: todayTasks.length,
      habitsCount: habits.length,
      activeGoalsCount: activeGoals.length
    });

    return {
      success: true,
      summary: {
        tasks: {
          today: todayTasks.length,
          upcoming: upcomingTasks.length,
          overdue: overdueTasks.length,
          completed_today: completedToday.length,
          total_active: tasks.filter(t => t.status !== 'done' && !t.deleted).length
        },
        habits: {
          total: habits.length,
          completed_today: habitsCompletedToday.length,
          pending_today: habits.length - habitsCompletedToday.length
        },
        goals: {
          active: activeGoals.length,
          total: goals.length
        },
        notes: {
          total: notes.length,
          recent_count: recentNotes.length
        },
        journal: {
          total: journalEntries.length,
          recent_count: recentJournal.length
        }
      },
      today_tasks: todayTasks.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.due_date
      })),
      today_habits: habits.map(h => ({
        id: h.id,
        name: h.name,
        completed: habitsCompletedToday.some(ch => ch.id === h.id)
      })),
      message: 'Dashboard summary generated'
    };
  } catch (error) {
    logger.error('DashboardTools', 'Operation failed', { error,
      operation: 'get_dashboard_summary'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard summary'
    };
  }
}

/**
 * Get quick stats
 */
async function executeGetQuickStats(
  _args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    logger.info('DashboardTools', 'Getting quick stats');

    // Fetch minimal data for quick response
    const [tasks, habits] = await Promise.all([
      getTasks(),
      getHabits({ isActive: true })
    ]);

    // Today's tasks
    const todayTasks = tasks.filter(task =>
      task.status !== 'done' &&
      !task.deleted &&
      task.due_date &&
      isToday(new Date(task.due_date))
    );

    // Overdue tasks
    const overdueTasks = tasks.filter(task =>
      task.status !== 'done' &&
      !task.deleted &&
      task.due_date &&
      new Date(task.due_date) < startOfDay(new Date())
    );

    // Completed tasks today
    const completedToday = tasks.filter(task =>
      task.status === 'done' &&
      task.updated_at &&
      isToday(new Date(task.updated_at))
    );

    // Check habits completed today (quick check)
    let habitsCompletedCount = 0;
    for (const habit of habits.slice(0, 10)) { // Limit to first 10 for quick response
      if (habit.id && await wasHabitCompletedToday(habit.id)) {
        habitsCompletedCount++;
      }
    }

    logger.info('DashboardTools', 'Quick stats generated');

    return {
      success: true,
      stats: {
        tasks_today: todayTasks.length,
        tasks_overdue: overdueTasks.length,
        tasks_completed_today: completedToday.length,
        habits_total: habits.length,
        habits_completed_today: habitsCompletedCount,
        habits_pending_today: habits.length - habitsCompletedCount
      },
      message: `Today: ${todayTasks.length} tasks, ${habits.length - habitsCompletedCount} habits to complete`
    };
  } catch (error) {
    logger.error('DashboardTools', 'Operation failed', { error,
      operation: 'get_quick_stats'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quick stats'
    };
  }
}

/**
 * Get recent activity
 */
async function executeGetRecentActivity(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const days = (args.days as number | undefined) ?? 7;

    logger.info('DashboardTools', 'Getting recent activity', { days });

    const cutoffDate = addDays(new Date(), -days);

    // Fetch data
    const [tasks, notes, journalEntries] = await Promise.all([
      getTasks(),
      getNotes(),
      getJournalEntries()
    ]);

    // Recent completed tasks
    const recentCompletedTasks = tasks.filter(task =>
      task.status === 'done' &&
      task.updated_at &&
      new Date(task.updated_at) >= cutoffDate
    ).map(t => ({
      id: t.id,
      title: t.title,
      completed_at: t.updated_at,
      priority: t.priority
    }));

    // Recent notes
    const recentNotes = notes.filter(note =>
      note.createdAt >= cutoffDate
    ).map(n => ({
      id: n.id,
      title: n.title,
      created_at: n.createdAt,
      tags: n.tags
    }));

    // Recent journal entries
    const recentJournal = journalEntries.filter(entry =>
      entry.createdAt && new Date(entry.createdAt) >= cutoffDate
    ).map(j => ({
      id: j.id,
      tags: j.tags,
      created_at: j.createdAt
    }));

    logger.info('DashboardTools', 'Recent activity generated', {
      days,
      tasksCount: recentCompletedTasks.length,
      notesCount: recentNotes.length,
      journalCount: recentJournal.length
    });

    return {
      success: true,
      days,
      activity: {
        completed_tasks: recentCompletedTasks,
        new_notes: recentNotes,
        journal_entries: recentJournal
      },
      counts: {
        tasks: recentCompletedTasks.length,
        notes: recentNotes.length,
        journal: recentJournal.length,
        total: recentCompletedTasks.length + recentNotes.length + recentJournal.length
      },
      message: `Recent activity for last ${days} days`
    };
  } catch (error) {
    logger.error('DashboardTools', 'Operation failed', { error,
      operation: 'get_recent_activity',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recent activity'
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const dashboardTools: Tool[] = [
  {
    definition: getDashboardSummaryDefinition,
    execute: executeGetDashboardSummary
  },
  {
    definition: getQuickStatsDefinition,
    execute: executeGetQuickStats
  },
  {
    definition: getRecentActivityDefinition,
    execute: executeGetRecentActivity
  }
];
