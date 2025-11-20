/**
 * Standalone migration script
 *
 * Run this manually to migrate data from localStorage to Supabase
 * Only needs to be run once per user.
 *
 * Usage:
 *   npm run migrate
 *
 * Or from browser console:
 *   await runAllMigrations()
 */

import { migrateNotes } from '../utils/migrateNotes';
import { migrateJournalEntries } from '../utils/migrateJournalEntries';
import { migrateGoals } from '../utils/migrateGoals';
import { supabase } from '../lib/supabase';

interface MigrationSummary {
  totalMigrated: number;
  totalErrors: number;
  details: {
    notes: { migrated: number; errors: number };
    journal: { migrated: number; errors: number };
    goals: { migrated: number; errors: number };
    dreams: { migrated: number; errors: number };
  };
}

/**
 * Run all available migrations
 */
export async function runAllMigrations(): Promise<MigrationSummary> {
  console.log('🚀 Starting data migrations from localStorage to Supabase...\n');

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ Not authenticated. Please log in first.');
    throw new Error('Authentication required');
  }

  console.log(`✅ Authenticated as: ${user.email}\n`);

  const summary: MigrationSummary = {
    totalMigrated: 0,
    totalErrors: 0,
    details: {
      notes: { migrated: 0, errors: 0 },
      journal: { migrated: 0, errors: 0 },
      goals: { migrated: 0, errors: 0 },
      dreams: { migrated: 0, errors: 0 },
    },
  };

  // 1. Migrate Notes
  console.log('📝 Migrating Notes...');
  try {
    const notesResult = await migrateNotes();
    summary.details.notes = { migrated: notesResult.migrated, errors: notesResult.errors };
    summary.totalMigrated += notesResult.migrated;
    summary.totalErrors += notesResult.errors;

    if (notesResult.migrated > 0) {
      console.log(`✅ Notes: ${notesResult.migrated} migrated, ${notesResult.errors} errors\n`);
    } else {
      console.log('ℹ️  Notes: Already migrated or no data found\n');
    }
  } catch (error) {
    console.error('❌ Notes migration failed:', error);
  }

  // 2. Migrate Journal Entries
  console.log('📖 Migrating Journal Entries...');
  try {
    const journalResult = await migrateJournalEntries();
    summary.details.journal = { migrated: journalResult.migrated, errors: journalResult.errors };
    summary.totalMigrated += journalResult.migrated;
    summary.totalErrors += journalResult.errors;

    if (journalResult.migrated > 0) {
      console.log(`✅ Journal: ${journalResult.migrated} migrated, ${journalResult.errors} errors\n`);
    } else {
      console.log('ℹ️  Journal: Already migrated or no data found\n');
    }
  } catch (error) {
    console.error('❌ Journal migration failed:', error);
  }

  // 3. Migrate Goals and Dreams
  console.log('🎯 Migrating Goals and Dreams...');
  try {
    const goalsResult = await migrateGoals();
    summary.details.goals = { migrated: goalsResult.goalsMigrated, errors: goalsResult.goalsErrors };
    summary.details.dreams = { migrated: goalsResult.dreamsMigrated, errors: goalsResult.dreamsErrors };
    summary.totalMigrated += goalsResult.goalsMigrated + goalsResult.dreamsMigrated;
    summary.totalErrors += goalsResult.goalsErrors + goalsResult.dreamsErrors;

    if (goalsResult.goalsMigrated > 0 || goalsResult.dreamsMigrated > 0) {
      console.log(`✅ Goals: ${goalsResult.goalsMigrated} migrated, ${goalsResult.goalsErrors} errors`);
      console.log(`✅ Dreams: ${goalsResult.dreamsMigrated} migrated, ${goalsResult.dreamsErrors} errors\n`);
    } else {
      console.log('ℹ️  Goals/Dreams: Already migrated or no data found\n');
    }
  } catch (error) {
    console.error('❌ Goals/Dreams migration failed:', error);
  }

  // Print summary
  console.log('=' + '='.repeat(50));
  console.log('📊 Migration Summary');
  console.log('=' + '='.repeat(50));
  console.log(`Total items migrated: ${summary.totalMigrated}`);
  console.log(`Total errors: ${summary.totalErrors}`);
  console.log('\nDetails:');
  console.log(`  Notes:   ${summary.details.notes.migrated} migrated, ${summary.details.notes.errors} errors`);
  console.log(`  Journal: ${summary.details.journal.migrated} migrated, ${summary.details.journal.errors} errors`);
  console.log(`  Goals:   ${summary.details.goals.migrated} migrated, ${summary.details.goals.errors} errors`);
  console.log(`  Dreams:  ${summary.details.dreams.migrated} migrated, ${summary.details.dreams.errors} errors`);
  console.log('=' + '='.repeat(50));

  if (summary.totalMigrated > 0) {
    console.log('\n✅ Migration complete! Your data has been moved to Supabase.');
    console.log('   You can now access it from any device.');
  } else {
    console.log('\nℹ️  No new data to migrate. Everything is up to date!');
  }

  return summary;
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).runAllMigrations = runAllMigrations;
  console.log('💡 Migration script loaded. Run `await runAllMigrations()` in console to migrate data.');
}
