/**
 * Weekly Planning Service
 * Analyzes upcoming week and generates planning suggestions
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import { getTasks } from '@/api/tasksAPI';
import { getCalendarEvents } from '@/api/calendarAPI';
import { getGoals } from '@/api/goalsAPI';
import { getHabits } from '@/api/habitsAPI';
import { getBills } from '@/api/billsAPI';
import { getFocusSessions } from '@/api/focusAPI';
import { logger } from '@/services/logger';
import { 
  startOfWeek, endOfWeek, addWeeks, format, parseISO, 
  differenceInDays, isWithinInterval, subWeeks 
} from 'date-fns';
import type { 
  WeeklyOverview, WeeklyReview, WeekEvent, WeekTask, 
  WeekGoal, WeekHabit, WeekBill, GoalCheckIn 
} from './types';

/**
 * Get overview of the upcoming week
 */
export async function getWeeklyOverview(weekOffset = 0): Promise<WeeklyOverview> {
  // Use API layer instead of direct Supabase
  const today = new Date();
  const targetWeekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 0 });
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 0 });

  // Fetch all data in parallel using API layer
  const [allEvents, allTasks, allGoals, allHabits, allBills] = await Promise.all([
    getCalendarEvents(),
    getTasks(),
    getGoals(),
    getHabits(),
    getBills(),
  ]);

  // Filter events for the target week
  const eventsInWeek = allEvents.filter(e => {
    if (!e.start_time) return false;
    const startTime = parseISO(e.start_time);
    return startTime >= targetWeekStart && startTime <= targetWeekEnd;
  }).sort((a, b) => {
    if (!a.start_time || !b.start_time) return 0;
    return parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime();
  });

  // Filter tasks for todo/in_progress status (not 'pending' which doesn't exist)
  const pendingTasks = allTasks.filter(t => t.status === 'todo' || t.status === 'in_progress');

  // Filter goals for in-progress status (not 'active' which doesn't exist)
  const activeGoals = allGoals.filter(g => g.status === 'in-progress');

  // Filter habits for active status
  const activeHabits = allHabits.filter(h => h.is_active);

  // Filter bills for the target week
  const billsInWeek = allBills.filter(b => {
    if (!b.is_active || !b.due_date) return false;
    const dueDate = parseISO(b.due_date);
    return dueDate >= targetWeekStart && dueDate <= targetWeekEnd;
  });

  // Process events
  const events: WeekEvent[] = eventsInWeek.map(e => ({
    id: e.id,
    title: e.title,
    date: e.start_time ? format(parseISO(e.start_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startTime: e.all_day || !e.start_time ? undefined : format(parseISO(e.start_time), 'HH:mm'),
    endTime: e.all_day || !e.end_time ? undefined : format(parseISO(e.end_time), 'HH:mm'),
    isAllDay: e.all_day || false,
  }));

  // Find busy days (3+ events)
  const eventsByDay: Record<string, number> = {};
  events.forEach(e => {
    eventsByDay[e.date] = (eventsByDay[e.date] || 0) + 1;
  });
  const busyDays = Object.entries(eventsByDay)
    .filter(([, count]) => count >= 3)
    .map(([day]) => day);

  // Process tasks
  const tasksDue: WeekTask[] = [];
  const tasksOverdue: WeekTask[] = [];
  const unscheduledTasks: WeekTask[] = [];

  pendingTasks.forEach(t => {
    const task: WeekTask = {
      id: t.id || '',
      title: t.title,
      dueDate: t.due_date || undefined,
      priority: t.priority || 'medium',
      estimatedHours: t.estimated_time ? t.estimated_time / 60 : undefined, // Convert minutes to hours
      category: t.category || undefined,
    };

    if (!t.due_date) {
      unscheduledTasks.push(task);
    } else {
      const dueDate = parseISO(t.due_date);
      if (isWithinInterval(dueDate, { start: targetWeekStart, end: targetWeekEnd })) {
        tasksDue.push(task);
      } else if (dueDate < today) {
        tasksOverdue.push(task);
      }
    }
  });

  // Process goals
  const goalsForWeek: WeekGoal[] = activeGoals.map(g => ({
    id: g.id,
    title: g.title,
    progress: g.progress || 0,
    targetDate: g.targetDate ? format(g.targetDate, 'yyyy-MM-dd') : undefined,
    category: g.category,
  }));

  // Generate goal check-ins
  const goalCheckIns: GoalCheckIn[] = goalsForWeek.slice(0, 3).map(g => ({
    goalId: g.id,
    goalTitle: g.title,
    question: `How are you progressing on "${g.title}"?`,
    suggestedActions: [
      `Review current progress (${g.progress}%)`,
      'Identify blockers',
      'Set weekly milestones',
    ],
  }));

  // Process habits
  const habitsToMaintain: WeekHabit[] = activeHabits.map(h => ({
    id: h.id || '',
    name: h.name,
    currentStreak: h.streak_count || 0,
    frequency: h.frequency || 'daily',
    completedThisWeek: 0, // Would need habit_logs query
    targetThisWeek: h.target_value || 7,
  }));

  const streaksAtRisk = habitsToMaintain.filter(h => h.currentStreak >= 7);

  // Process bills
  const billsDue: WeekBill[] = billsInWeek.map(b => ({
    id: b.id || '',
    name: b.name,
    amount: b.amount,
    dueDate: b.due_date || '',
    isAutoPay: b.is_auto_pay || false,
  }));

  // Calculate workload
  const totalEstimatedHours = tasksDue.reduce((sum, t) => sum + (t.estimatedHours || 1), 0);
  let estimatedWorkload: 'light' | 'moderate' | 'heavy' | 'overloaded' = 'light';
  if (totalEstimatedHours > 40) estimatedWorkload = 'overloaded';
  else if (totalEstimatedHours > 25) estimatedWorkload = 'heavy';
  else if (totalEstimatedHours > 10) estimatedWorkload = 'moderate';

  // Generate warnings
  const warnings: string[] = [];
  if (tasksOverdue.length > 0) warnings.push(`${tasksOverdue.length} overdue task(s)`);
  if (busyDays.length > 2) warnings.push('Multiple busy days this week');
  if (streaksAtRisk.length > 0) warnings.push(`${streaksAtRisk.length} habit streak(s) at risk`);
  if (billsDue.filter(b => !b.isAutoPay).length > 0) warnings.push('Bills due that need manual payment');

  return {
    weekStart: format(targetWeekStart, 'yyyy-MM-dd'),
    weekEnd: format(targetWeekEnd, 'yyyy-MM-dd'),
    events,
    eventCount: events.length,
    busyDays,
    tasksDue,
    tasksOverdue,
    unscheduledTasks,
    activeGoals: goalsForWeek,
    goalCheckIns,
    habitsToMaintain,
    streaksAtRisk,
    billsDue,
    estimatedWorkload,
    suggestedFocusAreas: goalsForWeek.slice(0, 2).map(g => g.title),
    warnings,
  };
}

/**
 * Get weekly review for the past week
 */
export async function getWeeklyReview(weekOffset = -1): Promise<WeeklyReview> {
  // Use API layer instead of direct Supabase
  const today = new Date();
  const targetWeekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 0 });
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 0 });

  // Fetch all data using API layer
  const [allTasks, allFocusSessions] = await Promise.all([
    getTasks(),
    getFocusSessions(),
  ]);

  // Filter completed tasks for the target week
  const completedTasks = allTasks.filter(t => {
    if (t.status !== 'done' || !t.updated_at) return false; // 'done' not 'completed', use updated_at as proxy for completion
    const completedAt = parseISO(t.updated_at);
    return completedAt >= targetWeekStart && completedAt <= targetWeekEnd;
  });

  // Filter created tasks for the target week
  const createdTasks = allTasks.filter(t => {
    if (!t.created_at) return false;
    const createdAt = parseISO(t.created_at);
    return createdAt >= targetWeekStart && createdAt <= targetWeekEnd;
  });

  // Filter focus sessions for the target week
  const focusSessions = allFocusSessions.filter(s => {
    if (!s.started_at) return false;
    const startedAt = parseISO(s.started_at);
    return startedAt >= targetWeekStart && startedAt <= targetWeekEnd;
  });

  // Note: habit_logs would need API support - skipping for now
  const habitLogs: unknown[] = [];

  const tasksCompletedCount = completedTasks.length;
  const tasksCreatedCount = createdTasks.length;
  const focusMinutes = focusSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  // Generate insights
  const wins: string[] = [];
  const areasToImprove: string[] = [];

  if (tasksCompletedCount >= 10) wins.push(`Completed ${tasksCompletedCount} tasks!`);
  if (focusMinutes >= 300) wins.push(`${Math.round(focusMinutes / 60)} hours of focused work`);
  if ((habitLogs?.length || 0) >= 14) wins.push('Strong habit consistency');

  if (tasksCompletedCount < tasksCreatedCount) {
    areasToImprove.push('More tasks created than completed - consider prioritizing');
  }
  if (focusMinutes < 120) {
    areasToImprove.push('Low focus time - try scheduling dedicated focus blocks');
  }

  return {
    weekStart: format(targetWeekStart, 'yyyy-MM-dd'),
    weekEnd: format(targetWeekEnd, 'yyyy-MM-dd'),
    tasksCompleted: tasksCompletedCount,
    tasksCreated: tasksCreatedCount,
    completionRate: tasksCreatedCount > 0 ? Math.round((tasksCompletedCount / tasksCreatedCount) * 100) : 0,
    habitsCompleted: habitLogs?.length || 0,
    habitsMissed: 0, // Would need more complex calculation
    streaksGained: 0,
    streaksLost: 0,
    focusMinutes,
    focusSessions: focusSessions?.length || 0,
    goalProgress: [],
    wins,
    areasToImprove,
    lessonsLearned: [],
    topPrioritiesNextWeek: [],
  };
}

/**
 * Generate AI planning suggestions
 */
export async function getPlanningsuggestions(): Promise<string[]> {
  const overview = await getWeeklyOverview(0);
  const suggestions: string[] = [];

  if (overview.estimatedWorkload === 'overloaded') {
    suggestions.push('Consider delegating or postponing some tasks - your week looks overloaded');
  }

  if (overview.unscheduledTasks.length > 5) {
    suggestions.push(`You have ${overview.unscheduledTasks.length} unscheduled tasks - try scheduling your top 3`);
  }

  if (overview.busyDays.length > 0) {
    suggestions.push(`${overview.busyDays.join(', ')} look busy - protect some focus time`);
  }

  if (overview.streaksAtRisk.length > 0) {
    suggestions.push(`Protect your ${overview.streaksAtRisk.map(h => h.name).join(', ')} streak(s)`);
  }

  if (overview.billsDue.filter(b => !b.isAutoPay).length > 0) {
    suggestions.push('Remember to pay your bills this week');
  }

  if (overview.activeGoals.length > 0) {
    suggestions.push(`Make progress on: ${overview.activeGoals[0].title}`);
  }

  return suggestions;
}

