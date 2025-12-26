/**
 * Privacy Settings API
 * Manage user's default privacy/sharing preferences for modules
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth } from './apiWrapper';
import type { ShareableModule, ModulePermissionLevel } from '@/shared/types/connections';
import { logger } from '@/services/logger';

export type PrivacyPreferences = Record<ShareableModule, ModulePermissionLevel>;

/**
 * Get user's default privacy preferences
 */
export async function getPrivacyPreferences(): Promise<PrivacyPreferences> {
  return apiCall(async () => {
    const user = await requireAuth();

    const { data, error } = await supabase
      .from('user_preferences')
      .select('default_sharing_permissions')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no preferences exist yet, return defaults
      if (error.code === 'PGRST116') {
        logger.info('PrivacySettingsAPI', 'No preferences found, returning defaults');
        return getDefaultPrivacyPreferences();
      }
      throw error;
    }

    // Parse the JSONB field
    const permissions = data?.default_sharing_permissions as Record<string, string> | null;
    
    if (!permissions) {
      return getDefaultPrivacyPreferences();
    }

    // Convert to typed object
    return permissions as PrivacyPreferences;
  });
}

/**
 * Update user's default privacy preferences
 */
export async function updatePrivacyPreferences(
  preferences: PrivacyPreferences
): Promise<void> {
  return apiCall(async () => {
    const user = await requireAuth();

    // First, check if user_preferences record exists
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('user_preferences')
        .update({
          default_sharing_permissions: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Create new record
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          default_sharing_permissions: preferences,
        });

      if (error) throw error;
    }

    logger.info('PrivacySettingsAPI', 'Privacy preferences updated', { userId: user.id });
  });
}

/**
 * Get default privacy preferences (used when user hasn't set any yet)
 */
function getDefaultPrivacyPreferences(): PrivacyPreferences {
  return {
    // Productivity - mostly private by default
    habits: 'none',
    todos: 'view',
    notes: 'none',
    projects: 'view',

    // Wellbeing - private by default
    journal: 'none',
    skincare: 'none',
    mood: 'none',
    period: 'none',

    // Personal - some collaborative by default
    travel: 'collaborate',
    'trip-planner': 'collaborate',
    visa: 'view',
    finances: 'none',
    shopping: 'collaborate',
    meals: 'collaborate',
    goals: 'view',
  };
}

/**
 * Update privacy preference for a single module
 */
export async function updateModulePrivacy(
  module: ShareableModule,
  level: ModulePermissionLevel
): Promise<void> {
  return apiCall(async () => {
    const currentPrefs = await getPrivacyPreferences();
    const updatedPrefs = { ...currentPrefs, [module]: level };
    await updatePrivacyPreferences(updatedPrefs);
  });
}

