/**
 * React Query hooks for Smart Scheduling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, startOfDay, addMinutes } from 'date-fns';
import { supabase } from '../lib/supabase';
import {
  suggestTimesForTask,
  autoScheduleDay,
  getDaySchedule,
  findFreeSlots,
  DEFAULT_SCHEDULING_PREFS
} from '../services/scheduling';
import { scheduleEngine } from '../services/scheduler';
import type { UserSchedulingPrefs, SchedulingSuggestion, DaySchedule } from '../services/scheduling';

// Query keys
export const schedulingKeys = {
  all: ['scheduling'] as const,
  daySchedule: (date: string) => [...schedulingKeys.all, 'day', date] as const,
  suggestions: (taskId: string, date: string) => [...schedulingKeys.all, 'suggestions', taskId, date] as const,
  preferences: () => [...schedulingKeys.all, 'preferences'] as const,
  freeSlots: (date: string) => [...schedulingKeys.all, 'freeSlots', date] as const,
};

/**
 * Hook to get user's scheduling preferences
 */
export function useSchedulingPreferences() {
  return useQuery({
    queryKey: schedulingKeys.preferences(),
    queryFn: async (): Promise<UserSchedulingPrefs> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_SCHEDULING_PREFS;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // maybeSingle returns null if no row found, without throwing 406 error
      if (error || !data) return DEFAULT_SCHEDULING_PREFS;

      // Map database fields to our type
      return {
        workHoursStart: parseInt(data.work_hours_start?.split(':')[0] || '9'),
        workHoursEnd: parseInt(data.work_hours_end?.split(':')[0] || '17'),
        workDays: data.work_days || [1, 2, 3, 4, 5],
        peakEnergyStart: parseInt(data.peak_energy_start?.split(':')[0] || '9'),
        peakEnergyEnd: parseInt(data.peak_energy_end?.split(':')[0] || '12'),
        lowEnergyStart: parseInt(data.low_energy_start?.split(':')[0] || '14'),
        lowEnergyEnd: parseInt(data.low_energy_end?.split(':')[0] || '15'),
        preferDeepWorkMorning: true,
        maxMeetingsPerDay: data.max_tasks_per_day || 8,
        lunchBlockStart: 12,
        lunchBlockEnd: 13,
        bufferBetweenTasks: 5,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get day schedule with free slots
 */
export function useDaySchedule(date: Date) {
  const dateKey = format(date, 'yyyy-MM-dd');
  const { data: prefs = DEFAULT_SCHEDULING_PREFS } = useSchedulingPreferences();

  return useQuery({
    queryKey: schedulingKeys.daySchedule(dateKey),
    queryFn: async (): Promise<DaySchedule> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return getDaySchedule(date, [], prefs);
      }

      // Fetch calendar events for the day
      const { data: events } = await supabase
        .from('calendar_events')
        .select('id, title, start_date, start_time, end_date, end_time')
        .eq('user_id', user.id)
        .eq('start_date', dateKey);

      // Convert to Date objects
      const mappedEvents = (events || []).map(e => ({
        id: e.id,
        title: e.title,
        start: parseISO(`${e.start_date}T${e.start_time || '00:00'}`),
        end: parseISO(`${e.end_date || e.start_date}T${e.end_time || '23:59'}`),
      }));

      return getDaySchedule(date, mappedEvents, prefs);
    },
    enabled: !!date,
  });
}

/**
 * Hook to get scheduling suggestions for a task
 */
export function useTaskSchedulingSuggestions(
  task: { 
    id: string; 
    title: string; 
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedMinutes: number;
    complexity?: 'deep_work' | 'shallow' | 'routine';
  } | null,
  date: Date
) {
  const dateKey = format(date, 'yyyy-MM-dd');
  const { data: prefs = DEFAULT_SCHEDULING_PREFS } = useSchedulingPreferences();

  return useQuery({
    queryKey: schedulingKeys.suggestions(task?.id || '', dateKey),
    queryFn: async (): Promise<SchedulingSuggestion | null> => {
      if (!task) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch existing events
      const { data: events } = await supabase
        .from('calendar_events')
        .select('start_date, start_time, end_date, end_time')
        .eq('user_id', user.id)
        .eq('start_date', dateKey);

      const mappedEvents = (events || []).map(e => ({
        start: parseISO(`${e.start_date}T${e.start_time || '00:00'}`),
        end: parseISO(`${e.end_date || e.start_date}T${e.end_time || '23:59'}`),
      }));

      return suggestTimesForTask(task, { date, events: mappedEvents }, prefs);
    },
    enabled: !!task?.id && !!date,
  });
}

/**
 * Hook to get free slots for a day
 * Uses unified ScheduleEngine that considers ALL sources:
 * - calendar_events
 * - schedule_blocks
 * - scheduled tasks
 */
export function useFreeSlots(date: Date, minDurationMinutes: number = 15) {
  const dateKey = format(date, 'yyyy-MM-dd');
  const { data: prefs = DEFAULT_SCHEDULING_PREFS } = useSchedulingPreferences();

  return useQuery({
    queryKey: [...schedulingKeys.freeSlots(dateKey), minDurationMinutes],
    queryFn: async () => {
      // Use unified ScheduleEngine that considers ALL sources
      return scheduleEngine.findFreeSlots(date, prefs, minDurationMinutes);
    },
  });
}

/**
 * Result of auto-scheduling operation
 */
export interface AutoScheduleResult {
  scheduled: Array<{
    taskId: string;
    taskTitle: string;
    start: Date;
    end: Date;
  }>;
  unscheduled: Array<{
    taskId: string;
    taskTitle: string;
    reason: string;
  }>;
  totalScheduled: number;
  totalUnscheduled: number;
}

/**
 * Hook to auto-schedule multiple tasks for a day
 * Uses the unified ScheduleEngine that considers:
 * - ALL calendar events, schedule blocks, and existing scheduled tasks
 * - User's energy preferences and working hours
 * - Task dependencies and priorities
 */
export function useAutoScheduleMutation() {
  const queryClient = useQueryClient();
  const { data: prefs = DEFAULT_SCHEDULING_PREFS } = useSchedulingPreferences();

  return useMutation({
    mutationFn: async ({
      tasks,
      date,
    }: {
      tasks: Array<{
        id: string;
        title: string;
        priority: 'urgent' | 'high' | 'medium' | 'low';
        estimatedMinutes: number;
        complexity?: 'deep_work' | 'shallow' | 'routine';
        depends_on?: string[];
      }>;
      date: Date;
    }): Promise<AutoScheduleResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dateKey = format(date, 'yyyy-MM-dd');

      // Use the unified ScheduleEngine.planDay() which considers ALL sources
      const dayPlan = await scheduleEngine.planDay(tasks, date, prefs);

      const scheduled: AutoScheduleResult['scheduled'] = [];
      const unscheduled: AutoScheduleResult['unscheduled'] = [];
      const taskMap = new Map(tasks.map(t => [t.id, t]));

      // Update each scheduled task in the database
      for (const item of dayPlan.scheduledItems) {
        const task = taskMap.get(item.taskId);
        if (!task) continue;

        const timeStr = format(item.start, 'HH:mm');

        // Update task in database
        const { error } = await supabase
          .from('tasks')
          .update({
            due_date: dateKey,
            scheduled_time: timeStr,
            status: 'scheduled',
          })
          .eq('id', item.taskId)
          .eq('user_id', user.id);

        if (!error) {
          scheduled.push({
            taskId: item.taskId,
            taskTitle: task.title,
            start: item.start,
            end: item.end,
          });
        } else {
          unscheduled.push({
            taskId: item.taskId,
            taskTitle: task.title,
            reason: 'Database update failed',
          });
        }
      }

      // Add unscheduled tasks from the plan
      for (const taskId of dayPlan.unscheduledTasks) {
        const task = taskMap.get(taskId);
        if (task) {
          unscheduled.push({
            taskId,
            taskTitle: task.title,
            reason: 'No available time slot',
          });
        }
      }

      return {
        scheduled,
        unscheduled,
        totalScheduled: scheduled.length,
        totalUnscheduled: unscheduled.length,
      };
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      const dateKey = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: schedulingKeys.daySchedule(dateKey) });
      queryClient.invalidateQueries({ queryKey: schedulingKeys.freeSlots(dateKey) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

