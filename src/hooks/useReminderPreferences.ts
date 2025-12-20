/**
 * useReminderPreferences Hook
 * Manages reminder/notification preferences with database persistence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/react-query';
import { DEFAULT_REMINDER_PREFS, type ReminderPreferences } from '@/services/reminders';

// We'll use a subset of user_preferences for reminder settings
interface ReminderPreferencesDB {
  notifications_enabled: boolean;
  push_enabled: boolean;
  notification_types: {
    habits: boolean;
    tasks: boolean;
    calendar: boolean;
    bills: boolean;
    ai_suggestions: boolean;
    location_reminders: boolean;
    morning_briefing: boolean;
    weekly_report: boolean;
  };
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // TIME format from DB
  quiet_hours_end: string;
}

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_REMINDER_PREFS;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('notifications_enabled, push_enabled, notification_types, quiet_hours_enabled, quiet_hours_start, quiet_hours_end')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) return DEFAULT_REMINDER_PREFS;
      return dbToPreferences(data as ReminderPreferencesDB);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dbPrefs = preferencesToDb(prefs);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...dbPrefs,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scheduling.preferences() });
    },
  });
}

