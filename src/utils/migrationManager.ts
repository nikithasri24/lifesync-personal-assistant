/**
 * Centralized Migration Manager
 *
 * Tracks which migrations have been completed using Supabase database
 * instead of localStorage, allowing migrations to be tracked across devices.
 */

import { supabase } from '../lib/supabase';

interface MigrationResult {
  success: boolean;
  migrated: number;
  errors: number;
}

interface MigrationRecord {
  migration_name: string;
  completed_at: string;
  migrated_count: number;
  error_count: number;
  metadata?: Record<string, any>;
}

/**
 * Check if a migration has already been completed for the current user
 */
export async function isMigrationComplete(migrationName: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('migration_tracking')
      .select('migration_name')
      .eq('user_id', user.id)
      .eq('migration_name', migrationName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error(`[Migration] Error checking ${migrationName}:`, error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error(`[Migration] Exception checking ${migrationName}:`, error);
    return false;
  }
}

/**
 * Mark a migration as complete in the database
 */
export async function markMigrationComplete(
  migrationName: string,
  result: MigrationResult,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn(`[Migration] No user found, cannot mark ${migrationName} as complete`);
      return;
    }

    const { error } = await supabase
      .from('migration_tracking')
      .insert({
        user_id: user.id,
        migration_name: migrationName,
        migrated_count: result.migrated,
        error_count: result.errors,
        metadata: metadata || {},
      });

    if (error) {
      console.error(`[Migration] Error marking ${migrationName} as complete:`, error);
    } else {
      console.log(`[Migration] ✅ Marked ${migrationName} as complete`);
    }
  } catch (error) {
    console.error(`[Migration] Exception marking ${migrationName} as complete:`, error);
  }
}

/**
 * Get all completed migrations for the current user
 */
export async function getCompletedMigrations(): Promise<MigrationRecord[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('migration_tracking')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[Migration] Error fetching completed migrations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Migration] Exception fetching completed migrations:', error);
    return [];
  }
}

/**
 * Check if table exists (for backwards compatibility during migration rollout)
 */
export async function migrationTrackingTableExists(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('migration_tracking')
      .select('migration_name')
      .limit(1);

    // If no error or "no rows" error, table exists
    return !error || error.code === 'PGRST116';
  } catch {
    return false;
  }
}
