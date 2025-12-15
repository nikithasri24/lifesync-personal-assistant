/**
 * Script to run finance migrations directly via Supabase client
 * Run with: npx tsx src/scripts/runFinanceMigrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../services/logger';

import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';

async function runMigration(sqlFilePath: string): Promise<boolean> {
  logger.debug('RunFinanceMigrations', `\n📄 Reading migration: ${path.basename(sqlFilePath)}`);

  const sql = fs.readFileSync(sqlFilePath, 'utf-8');

  logger.debug('RunFinanceMigrations', `📊 SQL length: ${sql.length} characters`);
  logger.debug('RunFinanceMigrations', `🚀 Executing migration...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      throw error;
    }

    logger.debug('RunFinanceMigrations', `✅ Migration completed successfully!`);
    return true;
  } catch (_error: unknown) {
    // If RPC doesn't exist, try using the SQL editor endpoint directly
    logger.debug('RunFinanceMigrations', `⚠️  RPC method not available, trying direct execution...`);

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      logger.debug('RunFinanceMigrations', `✅ Migration completed successfully!`);
      return true;
    } catch (fetchError: unknown) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      logger.error('RunFinanceMigrations', `❌ Migration failed:`, { error: errorMessage });
      return false;
    }
  }
}

async function main(): Promise<void> {
  logger.info('RunFinanceMigrations', '🔧 Finance Database Migration Runner\n');
  logger.debug('RunFinanceMigrations', `📍 Supabase URL: ${SUPABASE_URL}`);
  logger.debug('RunFinanceMigrations', `🔑 Using API key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);

  const migrationsDir = path.join(__dirname, '../../supabase/migrations');

  const migrations = [
    '20250115_finance_init.sql',
    '20250116_categorization_rules.sql'
  ];

  logger.debug('RunFinanceMigrations', `\n📁 Migrations directory: ${migrationsDir}`);
  logger.debug('RunFinanceMigrations', `📋 Migrations to run: ${migrations.length}\n`);

  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration);

    if (!fs.existsSync(filePath)) {
      logger.error('RunFinanceMigrations', `❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }

    const success = await runMigration(filePath);

    if (!success) {
      logger.error('RunFinanceMigrations', `\n❌ Migration failed: ${migration}`);
      logger.error('RunFinanceMigrations', `\n💡 Please run the SQL manually in Supabase Dashboard → SQL Editor`);
      process.exit(1);
    }
  }

  logger.info('RunFinanceMigrations', '\n✅ All migrations completed successfully!');
  logger.info('RunFinanceMigrations', '\n🎉 Finance schema is ready!');
  logger.info('RunFinanceMigrations', '\n📝 Next steps:');
  logger.info('RunFinanceMigrations', '   1. Create an account and categories');
  logger.info('RunFinanceMigrations', '   2. Add test transactions');
  logger.info('RunFinanceMigrations', '   3. Try auto-categorization!');
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error('RunFinanceMigrations', 'Fatal error:', { error: errorMessage });
  process.exit(1);
});
