/**
 * useHabitReminders Hook
 * Schedules daily reminders for habits with reminder_enabled = true
 * Uses API layer for all database access
 */

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHabitsWithReminders, getHabitsWithStreaks, checkHabitCompletionForDate } from '@/api/habitsAPI';
import { queryKeys } from '@/lib/react-query';
import { smartReminderService } from '@/services/reminders/SmartReminderService';
import { setHours, setMinutes, isAfter, startOfDay, addDays } from 'date-fns';

/**
 * Parse time string (HH:mm or HH:mm:ss) to Date for today
 */
function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  return setMinutes(setHours(now, hours), minutes);
}

/**
 * Hook to schedule habit reminders for the day
 * Should be called once on app init
 */
export function useHabitReminders(enabled: boolean = true) {
  const scheduledRef = useRef<Set<string>>(new Set());
  const lastScheduleDateRef = useRef<string>('');

  const { data: habits } = useQuery({
    queryKey: [...queryKeys.habits.all, 'with-reminders'],
    queryFn: getHabitsWithReminders,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  });

  useEffect(() => {
    if (!enabled || !habits || habits.length === 0) return;

    const today = startOfDay(new Date()).toISOString();
    
    // Reset scheduled set if it's a new day
    if (lastScheduleDateRef.current !== today) {
      scheduledRef.current.clear();
      lastScheduleDateRef.current = today;
    }

    const scheduleReminders = async () => {
      const now = new Date();

      for (const habit of habits) {
        // Skip if already scheduled today
        if (scheduledRef.current.has(habit.id!)) continue;

        if (!habit.reminder_time) continue;

        const reminderTime = parseTimeToDate(habit.reminder_time);

        // If reminder time has passed for today, schedule for tomorrow
        let scheduledFor = reminderTime;
        if (isAfter(now, reminderTime)) {
          scheduledFor = addDays(reminderTime, 1);
        }

        try {
          await smartReminderService.scheduleHabitReminder(
            habit.id!,
            habit.name,
            habit.streak_count || 0,
            scheduledFor
          );
          scheduledRef.current.add(habit.id!);
        } catch (error) {
          console.error(`Failed to schedule reminder for habit ${habit.name}:`, error);
        }
      }
    };

    scheduleReminders();
  }, [enabled, habits]);
}

/**
 * Hook to schedule streak protection alerts for habits at risk
 * Called in the evening to remind users about incomplete habits with streaks
 */
export function useStreakProtectionAlerts(enabled: boolean = true) {
  const { data: habits } = useQuery({
    queryKey: [...queryKeys.habits.all, 'streak-protection'],
    queryFn: () => getHabitsWithStreaks(3), // Only protect streaks >= 3 days
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  useEffect(() => {
    if (!enabled || !habits || habits.length === 0) return;

    const scheduleAlerts = async () => {
      const today = new Date().toISOString().split('T')[0];

      for (const habit of habits) {
        // Check if habit was completed today using API
        const isCompleted = await checkHabitCompletionForDate(habit.id!, today);

        // If not completed, schedule streak protection alert
        if (!isCompleted) {
          await smartReminderService.scheduleStreakProtectionAlert(
            habit.id!,
            habit.name,
            habit.streak_count || 0
          );
        }
      }
    };

    scheduleAlerts();
  }, [enabled, habits]);
}
