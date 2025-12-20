/**
 * Weekly Planning Service
 * Analyzes upcoming week and generates planning suggestions
 */

import { supabase } from '@/lib/supabase';
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const targetWeekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 0 });
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 0 });

  // Fetch all data in parallel
  const [eventsResult, tasksResult, goalsResult, habitsResult, billsResult] = await Promise.all([
    // Events
    supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, all_day')
      .eq('user_id', user.id)
      .gte('start_time', targetWeekStart.toISOString())
      .lte('start_time', targetWeekEnd.toISOString())
      .order('start_time'),
    
    // Tasks
    supabase
      .from('tasks')
      .select('id, title, due_date, priority, estimated_hours, category, status')
      .eq('user_id', user.id)
      .eq('status', 'pending'),
    
    // Goals
    supabase
      .from('goals')
      .select('id, title, progress, target_date, category')
      .eq('user_id', user.id)
      .eq('status', 'active'),
    
    // Habits
    supabase
      .from('habits')
      .select('id, name, frequency, current_streak, target_count')
      .eq('user_id', user.id)
      .eq('is_active', true),
    
    // Bills
    supabase
      .from('recurring_bills')
      .select('id, name, amount, due_date, is_auto_pay')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gte('due_date', format(targetWeekStart, 'yyyy-MM-dd'))
      .lte('due_date', format(targetWeekEnd, 'yyyy-MM-dd')),
  ]);

  // Process events
  const events: WeekEvent[] = (eventsResult.data || []).map(e => ({
    id: e.id,
    title: e.title,
    date: format(parseISO(e.start_time), 'yyyy-MM-dd'),
    startTime: e.all_day ? undefined : format(parseISO(e.start_time), 'HH:mm'),
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
  const allTasks = tasksResult.data || [];
  const tasksDue: WeekTask[] = [];
  const tasksOverdue: WeekTask[] = [];
  const unscheduledTasks: WeekTask[] = [];

  allTasks.forEach(t => {
    const task: WeekTask = {
      id: t.id,
      title: t.title,
      dueDate: t.due_date,
      priority: t.priority || 'medium',
      estimatedHours: t.estimated_hours,
      category: t.category,
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
  const activeGoals: WeekGoal[] = (goalsResult.data || []).map(g => ({
    id: g.id,
    title: g.title,
    progress: g.progress || 0,
    targetDate: g.target_date,
    category: g.category,
  }));

  // Generate goal check-ins
  const goalCheckIns: GoalCheckIn[] = activeGoals.slice(0, 3).map(g => ({
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
  const habitsToMaintain: WeekHabit[] = (habitsResult.data || []).map(h => ({
    id: h.id,
    name: h.name,
    currentStreak: h.current_streak || 0,
    frequency: h.frequency || 'daily',
    completedThisWeek: 0, // Would need habit_logs query
    targetThisWeek: h.target_count || 7,
  }));

  const streaksAtRisk = habitsToMaintain.filter(h => h.currentStreak >= 7);

  // Process bills
  const billsDue: WeekBill[] = (billsResult.data || []).map(b => ({
    id: b.id,
    name: b.name,
    amount: b.amount,
    dueDate: b.due_date,
    isAutoPay: b.is_auto_pay,
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
    activeGoals,
    goalCheckIns,
    habitsToMaintain,
    streaksAtRisk,
    billsDue,
    estimatedWorkload,
    suggestedFocusAreas: activeGoals.slice(0, 2).map(g => g.title),
    warnings,
  };
}

/**
 * Get weekly review for the past week
 */
export async function getWeeklyReview(weekOffset = -1): Promise<WeeklyReview> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const today = new Date();
  const targetWeekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 0 });
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 0 });

  // Fetch completed tasks
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('completed_at', targetWeekStart.toISOString())
    .lte('completed_at', targetWeekEnd.toISOString());

  // Fetch created tasks
  const { data: createdTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', targetWeekStart.toISOString())
    .lte('created_at', targetWeekEnd.toISOString());

  // Fetch focus sessions
  const { data: focusSessions } = await supabase
    .from('focus_sessions')
    .select('duration_minutes')
    .eq('user_id', user.id)
    .gte('started_at', targetWeekStart.toISOString())
    .lte('started_at', targetWeekEnd.toISOString());

  // Fetch habit logs
  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('id, habit_id')
    .eq('user_id', user.id)
    .gte('completed_at', targetWeekStart.toISOString())
    .lte('completed_at', targetWeekEnd.toISOString());

  const tasksCompletedCount = completedTasks?.length || 0;
  const tasksCreatedCount = createdTasks?.length || 0;
  const focusMinutes = focusSessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

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

