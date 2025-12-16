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
        .single();

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
 */
export function useFreeSlots(date: Date, minDurationMinutes: number = 15) {
  const dateKey = format(date, 'yyyy-MM-dd');
  const { data: prefs = DEFAULT_SCHEDULING_PREFS } = useSchedulingPreferences();

  return useQuery({
    queryKey: [...schedulingKeys.freeSlots(dateKey), minDurationMinutes],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return findFreeSlots(date, [], prefs, minDurationMinutes);

      const { data: events } = await supabase
        .from('calendar_events')
        .select('start_date, start_time, end_date, end_time')
        .eq('user_id', user.id)
        .eq('start_date', dateKey);

      const mappedEvents = (events || []).map(e => ({
        start: parseISO(`${e.start_date}T${e.start_time || '00:00'}`),
        end: parseISO(`${e.end_date || e.start_date}T${e.end_time || '23:59'}`),
      }));

      return findFreeSlots(date, mappedEvents, prefs, minDurationMinutes);
    },
  });
}

