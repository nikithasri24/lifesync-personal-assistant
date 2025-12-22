/**
 * User Settings API
 * CRUD operations for user preferences and settings
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth } from './apiWrapper';

export interface UserSettings {
  id?: string;
  user_id: string;
  reminder_preferences?: Record<string, unknown>;
  notification_preferences?: Record<string, unknown>;
  theme?: string;
  language?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  id?: string;
  user_id: string;
  home_location?: Record<string, unknown>;
  work_location?: Record<string, unknown>;
  saved_locations?: Record<string, unknown>[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Get user settings
 */
export async function getUserSettings(): Promise<UserSettings | null> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as UserSettings;
    },
    { domain: 'UserSettingsAPI', operation: 'getUserSettings' }
  );
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    { domain: 'UserSettingsAPI', operation: 'updateUserSettings' }
  );
}

/**
 * Get notification queue items count
 */
export async function getNotificationQueueCount(params?: {
  status?: string;
  since?: string;
}): Promise<number> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('notification_queue')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (params?.status) {
        query = query.eq('status', params.status);
      }

      if (params?.since) {
        query = query.gte('sent_at', params.since);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    { domain: 'UserSettingsAPI', operation: 'getNotificationQueueCount', data: { params } }
  );
}

/**
 * Get user preferences (location, etc.)
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as UserPreferences;
    },
    { domain: 'UserSettingsAPI', operation: 'getUserPreferences' }
  );
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  preferences: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    { domain: 'UserSettingsAPI', operation: 'updateUserPreferences' }
  );
}

