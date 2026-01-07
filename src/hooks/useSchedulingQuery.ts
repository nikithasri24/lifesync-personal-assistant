/**
 * React Query hooks for Smart Scheduling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endOfDay, format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';
import { getCalendarEvents } from '../api/calendarAPI';
import { getTasksByIds, updateTask } from '../api/tasksAPI';
import { getUserPreferences } from '../api/userSettingsAPI';
import {
  suggestTimesForTask,
  getDaySchedule,
  DEFAULT_SCHEDULING_PREFS
} from '../services/scheduling';
import { scheduleEngine } from '../services/scheduler';
import { dataEvents } from '../lib/dataEvents';
import type { TaskData } from '../services/types';
import type { UserSchedulingPrefs, SchedulingSuggestion, DaySchedule } from '../services/scheduling';

// Query keys
export const schedulingKeys = {
  all: ['scheduling'] as const,
  daySchedule: (date: string) => [...schedulingKeys.all, 'day', date] as const,
  suggestions: (taskId: string, date: string) => [...schedulingKeys.all, 'suggestions', taskId, date] as const,
  preferences: () => [...schedulingKeys.all, 'preferences'] as const,
  freeSlots: (date: string) => [...schedulingKeys.all, 'freeSlots', date] as const,
};

function clampEventToDay(start: Date, end: Date, date: Date): { start: Date; end: Date } | null {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const clampedStart = isBefore(start, dayStart) ? dayStart : start;
  const clampedEnd = isAfter(end, dayEnd) ? dayEnd : end;

  if (!isBefore(clampedStart, clampedEnd)) return null;
  return { start: clampedStart, end: clampedEnd };
}

/**
 * Hook to get user's scheduling preferences
 */
export function useSchedulingPreferences() {
  return useQuery({
    queryKey: schedulingKeys.preferences(),
    queryFn: async (): Promise<UserSchedulingPrefs> => {
      try {
        const data = await getUserPreferences();
        if (!data) return DEFAULT_SCHEDULING_PREFS;

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
      } catch {
        return DEFAULT_SCHEDULING_PREFS;
      }
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
      try {
        const events = await scheduleEngine.getAllEventsForDay(date);
        const mappedEvents = events.map(event => ({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          type:
            event.type === 'schedule_block'
              ? 'block'
              : event.type === 'scheduled_task'
                ? 'task'
                : 'event',
        }));

        return getDaySchedule(date, mappedEvents, prefs);
      } catch {
        return getDaySchedule(date, [], prefs);
      }
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
      try {
        const events = await getCalendarEvents({ startDate: dateKey, endDate: dateKey });
        const mappedEvents = events
          .map(e => {
            const start = parseISO(`${e.start_date}T${e.start_time || '00:00'}`);
            const end = parseISO(`${e.end_date || e.start_date}T${e.end_time || '23:59'}`);
            return clampEventToDay(start, end, date);
          })
          .filter((event): event is { start: Date; end: Date } => event !== null);

        return suggestTimesForTask(task, { date, events: mappedEvents }, prefs);
      } catch {
        return null;
      }
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
export function useScheduleFreeSlots(date: Date, minDurationMinutes: number = 15) {
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
  conflicts: Array<{
    event1Title: string;
    event2Title: string;
    overlapMinutes: number;
    suggestedResolution: 'move_earlier' | 'move_later' | 'shorten' | 'reschedule';
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
      const dateKey = format(date, 'yyyy-MM-dd');

      // Use the unified ScheduleEngine.planDay() which considers ALL sources
      const dayPlan = await scheduleEngine.planDay(tasks, date, prefs);

      const scheduled: AutoScheduleResult['scheduled'] = [];
      const unscheduled: AutoScheduleResult['unscheduled'] = [];
      const taskMap = new Map(tasks.map(t => [t.id, t]));

      const previousById = new Map<string, Partial<TaskData>>();

      const previousRows = await getTasksByIds(dayPlan.scheduledItems.map(item => item.taskId));
      for (const row of previousRows) {
        if (!row.id) continue;
        previousById.set(row.id, {
          due_date: row.due_date ?? null,
          scheduled_start: row.scheduled_start ?? null,
          scheduled_end: row.scheduled_end ?? null,
          status: row.status,
        });
      }

      const updatedIds: string[] = [];
      let hasUpdateFailure = false;

      // Update each scheduled task in the database
      for (const item of dayPlan.scheduledItems) {
        const task = taskMap.get(item.taskId);
        if (!task) continue;

        const scheduledStart = item.start.toISOString();
        const scheduledEnd = item.end.toISOString();

        try {
          await updateTask(item.taskId, {
            due_date: dateKey,
            scheduled_start: scheduledStart,
            scheduled_end: scheduledEnd,
            status: 'scheduled',
          });
          updatedIds.push(item.taskId);
          scheduled.push({
            taskId: item.taskId,
            taskTitle: task.title,
            start: item.start,
            end: item.end,
          });
        } catch {
          hasUpdateFailure = true;
          unscheduled.push({
            taskId: item.taskId,
            taskTitle: task.title,
            reason: 'Database update failed',
          });
        }
      }

      if (hasUpdateFailure && updatedIds.length > 0) {
        for (const taskId of updatedIds) {
          const previous = previousById.get(taskId);
          if (!previous) continue;
          try {
            await updateTask(taskId, previous);
          } catch {
            // Ignore rollback errors to avoid masking the original failure
          }
        }

        scheduled.length = 0;
        unscheduled.length = 0;
      }

      // Add unscheduled tasks from the plan
      for (const taskId of dayPlan.unscheduledTasks) {
        const task = taskMap.get(taskId);
        if (task) {
          unscheduled.push({
            taskId,
            taskTitle: task.title,
            reason: dayPlan.unscheduledReasons?.[taskId] || 'No available time slot',
          });
        }
      }

      if (hasUpdateFailure && updatedIds.length > 0) {
        for (const taskId of updatedIds) {
          const task = taskMap.get(taskId);
          if (task) {
            unscheduled.push({
              taskId,
              taskTitle: task.title,
              reason: 'Rolled back due to update failure',
            });
          }
        }
      }

      return {
        scheduled,
        unscheduled,
        conflicts: dayPlan.conflicts.map(conflict => ({
          event1Title: conflict.event1.title,
          event2Title: conflict.event2.title,
          overlapMinutes: conflict.overlapMinutes,
          suggestedResolution: conflict.suggestedResolution,
        })),
        totalScheduled: scheduled.length,
        totalUnscheduled: unscheduled.length,
      };
    },
    onSuccess: (result, variables) => {
      const dateKey = format(variables.date, 'yyyy-MM-dd');

      // Emit event - DataSyncProvider handles cache invalidation
      dataEvents.emit('schedule:auto-scheduled', {
        date: dateKey,
        taskIds: result.scheduled.map((s) => s.taskId),
      });
    },
  });
}
