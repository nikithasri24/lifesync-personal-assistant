/**
 * Utility to migrate notes from localStorage to Supabase database
 * This runs once on first load after the database migration
 */

import { supabase } from '../lib/supabase';
import type { Note } from '../types';
import {
  isMigrationComplete as checkMigrationComplete,
  markMigrationComplete as saveMigrationComplete,
  migrationTrackingTableExists
} from './migrationManager';

const MIGRATION_NAME = 'notes_v1';
const LEGACY_MIGRATION_KEY = 'notes_migrated';

interface LocalStorageState {
  state?: {
    notes?: Array<{
      id: string;
      title: string;
      content: string;
      tags: string[];
      category?: string;
      createdAt: string | Date;
      updatedAt: string | Date;
    }>;
  };
}

/**
 * Check if migration has already been completed
 * Checks both new Supabase tracking and legacy localStorage flag
 */
async function isMigrationComplete(): Promise<boolean> {
  // Check if migration tracking table exists
  const tableExists = await migrationTrackingTableExists();

  if (tableExists) {
    // Use Supabase tracking
    return await checkMigrationComplete(MIGRATION_NAME);
  }

  // Fallback to localStorage for backwards compatibility
  return localStorage.getItem(LEGACY_MIGRATION_KEY) === 'true';
}

/**
 * Mark migration as complete in both systems
 */
async function markMigrationComplete(result: { success: boolean; migrated: number; errors: number }): Promise<void> {
  // Mark in Supabase (new system)
  await saveMigrationComplete(MIGRATION_NAME, result);

  // Also mark in localStorage for backwards compatibility
  localStorage.setItem(LEGACY_MIGRATION_KEY, 'true');
}

/**
 * Get notes from localStorage (Zustand persist)
 */
function getLocalStorageNotes(): Note[] {
  try {
    // Zustand persist stores data under 'app-storage' key
    const stored = localStorage.getItem('app-storage');
    if (!stored) return [];

    const parsed: LocalStorageState = JSON.parse(stored);
    const notes = parsed.state?.notes || [];

    // Convert to proper Note format
    return notes.map((note) => ({
      ...note,
      createdAt: typeof note.createdAt === 'string'
        ? new Date(note.createdAt)
        : note.createdAt,
      updatedAt: typeof note.updatedAt === 'string'
        ? new Date(note.updatedAt)
        : note.updatedAt,
    }));
  } catch (error) {
    console.error('Error reading localStorage notes:', error);
    return [];
  }
}

/**
 * Migrate notes from localStorage to Supabase
 */
export async function migrateNotes(): Promise<{
  success: boolean;
  migrated: number;
  errors: number;
}> {
  // Skip if already migrated
  if (await isMigrationComplete()) {
    console.log('[Notes Migration] Already completed, skipping');
    return { success: true, migrated: 0, errors: 0 };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[Notes Migration] No authenticated user, skipping');
    return { success: false, migrated: 0, errors: 0 };
  }

  const localNotes = getLocalStorageNotes();

  if (localNotes.length === 0) {
    console.log('[Notes Migration] No notes to migrate');
    await markMigrationComplete({ success: true, migrated: 0, errors: 0 });
    return { success: true, migrated: 0, errors: 0 };
  }

  console.log(`[Notes Migration] Found ${localNotes.length} notes to migrate`);

  let migrated = 0;
  let errors = 0;

  for (const note of localNotes) {
    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: note.title || null,
          content: note.content,
          tags: note.tags || [],
          category: note.category || null,
          created_at: note.createdAt.toISOString(),
          // Preserve original timestamps
          updated_at: note.updatedAt.toISOString(),
        });

      if (error) {
        console.error(`[Notes Migration] Error migrating note ${note.id}:`, error);
        errors++;
      } else {
        migrated++;
      }
    } catch (error) {
      console.error(`[Notes Migration] Exception migrating note ${note.id}:`, error);
      errors++;
    }
  }

  console.log(`[Notes Migration] Complete: ${migrated} migrated, ${errors} errors`);

  // Mark as complete even if some errors occurred
  // We don't want to keep retrying failed entries
  const result = {
    success: errors === 0,
    migrated,
    errors,
  };
  await markMigrationComplete(result);

  return result;
}

/**
 * Reset migration flag (for debugging/testing)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_KEY);
  console.log('[Notes Migration] Migration flag reset');
}
