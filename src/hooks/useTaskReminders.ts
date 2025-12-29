/**
 * useTaskReminders Hook
 * Auto-creates reminders when tasks have a scheduled_start or due_date
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/react-query';
import { reminderService } from '@/services/reminders';
import { useReminderPreferences } from './useReminderPreferences';
import type { TaskData } from '@/services/types';
import { isAfter, parseISO, startOfDay, isSameDay, addMinutes, isToday } from 'date-fns';

/**
 * Get tasks with scheduled starts for today and upcoming
 */
async function getScheduledTasks(): Promise<TaskData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = startOfDay(new Date()).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .neq('status', 'done')
    .eq('deleted', false)
    .or(`scheduled_start.not.is.null,due_date.gte.${today}`)
    .order('scheduled_start', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching scheduled tasks:', error);
    return [];
  }

  return (data || []) as TaskData[];
}

/**
 * Hook to auto-create reminders for scheduled tasks
 * Schedules reminders 15 minutes before the scheduled_start
 */
export function useTaskReminders(enabled: boolean = true) {
  const scheduledRef = useRef<Set<string>>(new Set());
  const lastScheduleDateRef = useRef<string>('');
  const { data: prefs } = useReminderPreferences();

  const { data: tasks } = useQuery({
    queryKey: [...queryKeys.tasks.all, 'with-schedule'],
    queryFn: getScheduledTasks,
    enabled: enabled && prefs?.taskRemindersEnabled !== false,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  useEffect(() => {
    if (!enabled || !tasks || tasks.length === 0) return;
    if (prefs?.taskRemindersEnabled === false) return;

    const today = startOfDay(new Date()).toISOString();
    
    // Reset scheduled set if it's a new day
    if (lastScheduleDateRef.current !== today) {
      scheduledRef.current.clear();
      lastScheduleDateRef.current = today;
    }

    const scheduleReminders = async () => {
      const now = new Date();

      for (const task of tasks) {
        // Skip if already scheduled
        if (scheduledRef.current.has(task.id!)) continue;
        
        // Determine when to remind
        let reminderTriggerTime: Date | null = null;
        let reminderType: 'task_upcoming' | 'task_due' = 'task_upcoming';
        
        // Priority 1: scheduled_start (specific time today)
        if (task.scheduled_start) {
          const scheduledTime = parseISO(task.scheduled_start);
          if (isToday(scheduledTime) && isAfter(scheduledTime, now)) {
            reminderTriggerTime = scheduledTime;
            reminderType = 'task_upcoming';
          }
        }
        // Priority 2: due_date (remind in the morning if due today)
        else if (task.due_date) {
          const dueDate = parseISO(task.due_date);
          if (isSameDay(dueDate, now)) {
            // For due date tasks, remind at 9 AM if it's still before that
            const morningReminder = new Date();
            morningReminder.setHours(9, 0, 0, 0);
            if (isAfter(morningReminder, now)) {
              reminderTriggerTime = morningReminder;
              reminderType = 'task_due';
            }
          }
        }

        // Skip if no valid reminder time
        if (!reminderTriggerTime) continue;

        try {
          await reminderService.scheduleTaskReminder(
            task.id!,
            task.title,
            reminderTriggerTime,
            reminderType === 'task_upcoming' ? 15 : 0 // 15 min before scheduled, immediate for due
          );
          scheduledRef.current.add(task.id!);
        } catch (error) {
          console.error(`Failed to schedule reminder for task ${task.title}:`, error);
        }
      }
    };

    scheduleReminders();
  }, [enabled, tasks, prefs?.taskRemindersEnabled]);
}
