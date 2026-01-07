/**
 * useReminders Hook
 * Manage reminders and notification preferences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { reminderService, type NotificationQueueItem, type ScheduleReminderParams } from '@/services/reminders';

const REMINDERS_KEY = ['reminders'];
const PENDING_REMINDERS_KEY = ['reminders', 'pending'];

/**
 * Hook to get pending reminders
 */
export function usePendingReminders() {
  return useQuery({
    queryKey: PENDING_REMINDERS_KEY,
    queryFn: () => reminderService.getPendingReminders(),
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to schedule a reminder
 */
export function useScheduleReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: ScheduleReminderParams) => reminderService.scheduleReminder(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

/**
 * Hook to cancel a reminder
 */
export function useCancelReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reminderId: string) => reminderService.cancelReminder(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

/**
 * Hook to schedule task reminder
 */
export function useScheduleTaskReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { taskId: string; taskTitle: string; scheduledTime: Date; minutesBefore?: number }) =>
      reminderService.scheduleTaskReminder(
        params.taskId,
        params.taskTitle,
        params.scheduledTime,
        params.minutesBefore
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

/**
 * Hook to schedule event reminder
 */
export function useScheduleEventReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { eventId: string; eventTitle: string; eventTime: Date; minutesBefore?: number }) =>
      reminderService.scheduleEventReminder(
        params.eventId,
        params.eventTitle,
        params.eventTime,
        params.minutesBefore
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

/**
 * Hook to start/stop reminder checking on app mount
 */
export function useReminderChecker(enabled: boolean = true) {
  useEffect(() => {
    if (enabled) {
      reminderService.startReminderCheck(60000); // Check every minute
    }
    
    return () => {
      reminderService.stopReminderCheck();
    };
  }, [enabled]);
}

/**
 * Get upcoming reminders grouped by time
 */
export function useUpcomingReminders() {
  const { data: reminders = [], ...rest } = usePendingReminders();
  
  // Group by time: "In 15 min", "In 1 hour", "Later today", "Tomorrow"
  const grouped = {
    soon: [] as NotificationQueueItem[],      // < 30 min
    nextHour: [] as NotificationQueueItem[],  // 30min - 1 hour
    today: [] as NotificationQueueItem[],     // > 1 hour, same day
    later: [] as NotificationQueueItem[],     // Future days
  };
  
  const now = new Date();
  
  for (const reminder of reminders) {
    const scheduledFor = new Date(reminder.scheduled_for);
    const diffMs = scheduledFor.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);
    
    if (diffMins < 30) {
      grouped.soon.push(reminder);
    } else if (diffMins < 60) {
      grouped.nextHour.push(reminder);
    } else if (scheduledFor.toDateString() === now.toDateString()) {
      grouped.today.push(reminder);
    } else {
      grouped.later.push(reminder);
    }
  }
  
  return { grouped, reminders, ...rest };
}

