/**
 * User Settings API
 * CRUD operations for user preferences and settings
 */

import { supabase } from '../lib/supabase';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

/**
 * Get notification queue items count
 */
export async function getNotificationQueueCount(params?: {
  status?: string;
  since?: string;
}): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}

/**
 * Get user preferences (location, etc.)
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  preferences: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

