/**
 * useReminderPreferences Hook
 * Manages reminder/notification preferences with database persistence
 * Uses API layer for all database access
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReminderPreferences,
  updateReminderPreferences,
  type ReminderPreferencesDB,
} from '@/api/userSettingsAPI';
import { queryKeys } from '@/lib/react-query';
import { DEFAULT_REMINDER_PREFS, type ReminderPreferences } from '@/services/reminders';

/**
 * Convert DB format to ReminderPreferences
 */
function dbToPreferences(db: ReminderPreferencesDB | null): ReminderPreferences {
  if (!db) return DEFAULT_REMINDER_PREFS;
  
  return {
    enabled: db.notifications_enabled ?? true,
    taskRemindersEnabled: db.notification_types?.tasks ?? true,
    taskReminderMinutesBefore: 15, // Not stored in DB, use default
    overdueRemindersEnabled: db.notification_types?.tasks ?? true,
    eventRemindersEnabled: db.notification_types?.calendar ?? true,
    eventReminderMinutesBefore: 15,
    habitRemindersEnabled: db.notification_types?.habits ?? true,
    morningBriefingEnabled: db.notification_types?.morning_briefing ?? true,
    morningBriefingTime: '07:00', // Could be added to DB if needed
    quietHoursEnabled: db.quiet_hours_enabled ?? true,
    quietHoursStart: db.quiet_hours_start?.slice(0, 5) ?? '22:00',
    quietHoursEnd: db.quiet_hours_end?.slice(0, 5) ?? '07:00',
    soundEnabled: true,
    vibrationEnabled: true,
  };
}

/**
 * Convert ReminderPreferences to DB format
 */
function preferencesToDb(prefs: ReminderPreferences): Partial<ReminderPreferencesDB> {
  return {
    notifications_enabled: prefs.enabled,
    notification_types: {
      habits: prefs.habitRemindersEnabled,
      tasks: prefs.taskRemindersEnabled,
      calendar: prefs.eventRemindersEnabled,
      bills: true, // Not in ReminderPreferences, default true
      ai_suggestions: true,
      location_reminders: true,
      morning_briefing: prefs.morningBriefingEnabled,
      weekly_report: true,
    },
    quiet_hours_enabled: prefs.quietHoursEnabled,
    quiet_hours_start: prefs.quietHoursStart,
    quiet_hours_end: prefs.quietHoursEnd,
  };
}

/**
 * Hook to get reminder preferences
 */
export function useReminderPreferences() {
  return useQuery({
    queryKey: [...queryKeys.scheduling.preferences(), 'reminders'],
    queryFn: async (): Promise<ReminderPreferences> => {
      try {
        const data = await getReminderPreferences();
        return dbToPreferences(data);
      } catch {
        return DEFAULT_REMINDER_PREFS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update reminder preferences
 */
export function useUpdateReminderPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: ReminderPreferences): Promise<void> => {
      const dbPrefs = preferencesToDb(prefs);
      await updateReminderPreferences(dbPrefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.preferences() });
    },
  });
}
