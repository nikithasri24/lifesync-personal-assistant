/**
 * Utility to migrate journal entries from localStorage to Supabase database
 * This runs once on first load after the database migration
 */

import { supabase } from '../lib/supabase';
import type { JournalEntry, JournalMood } from '../types';

const MIGRATION_KEY = 'journal_entries_migrated';

interface LocalStorageState {
  state?: {
    journalEntries?: Array<{
      id: string;
      title: string;
      content: string;
      mood: JournalMood;
      tags: string[];
      attachments: any[];
      createdAt: string | Date;
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
 * Get journal entries from localStorage (Zustand persist)
 */
function getLocalStorageEntries(): JournalEntry[] {
  try {
    // Zustand persist stores data under 'app-storage' key
    const stored = localStorage.getItem('app-storage');
    if (!stored) return [];

    const parsed: LocalStorageState = JSON.parse(stored);
    const entries = parsed.state?.journalEntries || [];

    // Convert to proper JournalEntry format
    return entries.map((entry) => ({
      ...entry,
      createdAt: typeof entry.createdAt === 'string'
        ? new Date(entry.createdAt)
        : entry.createdAt,
    }));
  } catch (error) {
    console.error('Error reading localStorage journal entries:', error);
    return [];
  }
}

/**
 * Migrate journal entries from localStorage to Supabase
 */
export async function migrateJournalEntries(): Promise<{
  success: boolean;
  migrated: number;
  errors: number;
}> {
  // Skip if already migrated
  if (isMigrationComplete()) {
    console.log('[Journal Migration] Already completed, skipping');
    return { success: true, migrated: 0, errors: 0 };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('[Journal Migration] No authenticated user, skipping');
    return { success: false, migrated: 0, errors: 0 };
  }

  const localEntries = getLocalStorageEntries();

  if (localEntries.length === 0) {
    console.log('[Journal Migration] No entries to migrate');
    markMigrationComplete();
    return { success: true, migrated: 0, errors: 0 };
  }

  console.log(`[Journal Migration] Found ${localEntries.length} entries to migrate`);

  let migrated = 0;
  let errors = 0;

  for (const entry of localEntries) {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: entry.title || null,
          content: entry.content,
          mood: entry.mood,
          tags: entry.tags || [],
          attachments: entry.attachments || [],
          created_at: entry.createdAt.toISOString(),
          // Preserve original created_at timestamp
          updated_at: entry.createdAt.toISOString(),
        });

      if (error) {
        console.error(`[Journal Migration] Error migrating entry ${entry.id}:`, error);
        errors++;
      } else {
        migrated++;
      }
    } catch (error) {
      console.error(`[Journal Migration] Exception migrating entry ${entry.id}:`, error);
      errors++;
    }
  }

  console.log(`[Journal Migration] Complete: ${migrated} migrated, ${errors} errors`);

  // Mark as complete even if some errors occurred
  // We don't want to keep retrying failed entries
  markMigrationComplete();

  return {
    success: errors === 0,
    migrated,
    errors,
  };
}

/**
 * Reset migration flag (for debugging/testing)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_KEY);
  console.log('[Journal Migration] Migration flag reset');
}
