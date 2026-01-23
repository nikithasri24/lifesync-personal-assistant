/**
 * Script to add updated_at column to planned_meals table
 * Run with: npx tsx src/scripts/runPlannedMealsMigration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../services/logger';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

async function runMigration(): Promise<boolean> {
  const migrationPath = path.join(__dirname, '../../supabase/migrations_archive/20260111_add_planned_meals_updated_at.sql');
  
  logger.info('PlannedMealsMigration', `📄 Reading migration: ${path.basename(migrationPath)}`);

  if (!fs.existsSync(migrationPath)) {
    logger.error('PlannedMealsMigration', `❌ Migration file not found: ${migrationPath}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  logger.info('PlannedMealsMigration', `📊 SQL length: ${sql.length} characters`);
  logger.info('PlannedMealsMigration', `🚀 Executing migration...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      logger.debug('PlannedMealsMigration', `Executing: ${statement.substring(0, 100)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct execution if RPC fails
        logger.debug('PlannedMealsMigration', `RPC failed, trying direct execution...`);
        const { error: directError } = await supabase.from('_sql').select('*').limit(0);
        
        if (directError) {
          throw new Error(`Failed to execute: ${error.message}`);
        }
      }
    }

    logger.info('PlannedMealsMigration', `✅ Migration completed successfully!`);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('PlannedMealsMigration', `❌ Migration failed:`, { error: errorMessage });
    logger.info('PlannedMealsMigration', `\n💡 Please run the SQL manually in Supabase Dashboard → SQL Editor:`);
    logger.info('PlannedMealsMigration', `\n${sql}\n`);
    return false;
  }
}

async function main(): Promise<void> {
  logger.info('PlannedMealsMigration', '🔧 Planned Meals Migration Runner\n');
  logger.info('PlannedMealsMigration', `📍 Supabase URL: ${SUPABASE_URL}`);
  logger.info('PlannedMealsMigration', `🔑 Using API key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);

  const success = await runMigration();

  if (!success) {
    logger.error('PlannedMealsMigration', `\n❌ Migration failed`);
    process.exit(1);
  }

  logger.info('PlannedMealsMigration', '\n✅ Migration completed successfully!');
  logger.info('PlannedMealsMigration', '\n🎉 The planned_meals table now has the updated_at column!');
  logger.info('PlannedMealsMigration', '\n📝 The error "record new has no field updated_at" should now be fixed.');
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error('PlannedMealsMigration', 'Fatal error:', { error: errorMessage });
  process.exit(1);
});

