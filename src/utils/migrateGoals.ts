/**
 * Utility to migrate goals and dreams from localStorage to Supabase database
 * This runs once on first load after the database migration
 */

import { supabase } from '../lib/supabase';
import type { Goal, Dream } from '../types';

const MIGRATION_KEY = 'goals_dreams_migrated';

interface LocalStorageState {
  state?: {
    goals?: Array<{
      id: string;
      title: string;
      description?: string;
      category?: string;
      targetDate?: string | Date;
      status?: 'active' | 'completed' | 'archived' | 'on_hold';
      progress?: number;
      priority?: 'low' | 'medium' | 'high';
      createdAt: string | Date;
    }>;
    dreams?: Array<{
      id: string;
      title: string;
      description?: string;
      category?: string;
      notes?: string;
      createdAt: string | Date;
      lastUpdated: string | Date;
    }>;
  };
}

/**
 * Check if migration has already been completed
 */
export function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Get goals and dreams from localStorage (Zustand persist)
 */
function getLocalStorageData(): { goals: Goal[]; dreams: Dream[] } {
  try {
    // Zustand persist stores data under 'app-storage' key
    const stored = localStorage.getItem('app-storage');
    if (!stored) return { goals: [], dreams: [] };

    const parsed: LocalStorageState = JSON.parse(stored);

    const goals = (parsed.state?.goals || []).map((goal) => ({
      ...goal,
      createdAt: typeof goal.createdAt === 'string'
        ? new Date(goal.createdAt)
        : goal.createdAt,
      targetDate: goal.targetDate
        ? (typeof goal.targetDate === 'string' ? new Date(goal.targetDate) : goal.targetDate)
        : undefined,
    })) as Goal[];

    const dreams = (parsed.state?.dreams || []).map((dream) => ({
      ...dream,
      createdAt: typeof dream.createdAt === 'string'
        ? new Date(dream.createdAt)
        : dream.createdAt,
      lastUpdated: typeof dream.lastUpdated === 'string'
        ? new Date(dream.lastUpdated)
        : dream.lastUpdated,
    })) as Dream[];

    return { goals, dreams };
  } catch (error) {
    console.error('Error reading localStorage goals/dreams:', error);
    return { goals: [], dreams: [] };
  }
}

/**
 * Migrate goals and dreams from localStorage to Supabase
 */
export async function migrateGoals(): Promise<{
  success: boolean;
  goalsMigrated: number;
  dreamsMigrated: number;
  errors: number;
}> {
  // Skip if already migrated
  if (isMigrationComplete()) {
    console.log('[Goals/Dreams Migration] Already completed, skipping');
    return { success: true, goalsMigrated: 0, dreamsMigrated: 0, errors: 0 };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[Goals/Dreams Migration] No authenticated user, skipping');
    return { success: false, goalsMigrated: 0, dreamsMigrated: 0, errors: 0 };
  }

  const { goals, dreams } = getLocalStorageData();

  if (goals.length === 0 && dreams.length === 0) {
    console.log('[Goals/Dreams Migration] No data to migrate');
    markMigrationComplete();
    return { success: true, goalsMigrated: 0, dreamsMigrated: 0, errors: 0 };
  }

  console.log(`[Goals/Dreams Migration] Found ${goals.length} goals and ${dreams.length} dreams to migrate`);

  let goalsMigrated = 0;
  let dreamsMigrated = 0;
  let errors = 0;

  // Migrate goals
  for (const goal of goals) {
    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: goal.title,
          description: goal.description || null,
          category: goal.category || null,
          target_date: goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : null,
          status: goal.status || 'active',
          progress: goal.progress ?? 0,
          priority: goal.priority || 'medium',
          created_at: goal.createdAt.toISOString(),
          // Preserve original timestamp (updated_at will be set by trigger)
          updated_at: goal.createdAt.toISOString(),
        });

      if (error) {
        console.error(`[Goals Migration] Error migrating goal ${goal.id}:`, error);
        errors++;
      } else {
        goalsMigrated++;
      }
    } catch (error) {
      console.error(`[Goals Migration] Exception migrating goal ${goal.id}:`, error);
      errors++;
    }
  }

  // Migrate dreams
  for (const dream of dreams) {
    try {
      const { error } = await supabase
        .from('dreams')
        .insert({
          user_id: user.id,
          title: dream.title,
          description: dream.description || null,
          category: dream.category || null,
          notes: dream.notes || null,
          created_at: dream.createdAt.toISOString(),
          // Preserve original last_updated timestamp
          last_updated: dream.lastUpdated.toISOString(),
        });

      if (error) {
        console.error(`[Dreams Migration] Error migrating dream ${dream.id}:`, error);
        errors++;
      } else {
        dreamsMigrated++;
      }
    } catch (error) {
      console.error(`[Dreams Migration] Exception migrating dream ${dream.id}:`, error);
      errors++;
    }
  }

  console.log(
    `[Goals/Dreams Migration] Complete: ${goalsMigrated} goals, ${dreamsMigrated} dreams migrated, ${errors} errors`
  );

  // Mark as complete even if some errors occurred
  // We don't want to keep retrying failed entries
  markMigrationComplete();

  return {
    success: errors === 0,
    goalsMigrated,
    dreamsMigrated,
    errors,
  };
}

/**
 * Reset migration flag (for debugging/testing)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_KEY);
  console.log('[Goals/Dreams Migration] Migration flag reset');
}
