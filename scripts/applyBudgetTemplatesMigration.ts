#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('ApplyBudgetTemplatesMigration', 'Missing Supabase credentials in environment variables');
  process.exit(1);
}

async function applyMigration() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Read the migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251117_add_budget_templates.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  logger.info('ApplyBudgetTemplatesMigration', '📝 Applying budget templates migration...');
  logger.info('ApplyBudgetTemplatesMigration', 'Migration file:', migrationPath);
  logger.info('ApplyBudgetTemplatesMigration', '');

  // Note: This requires using the service role key or a user with sufficient privileges
  // The anon key won't have permission to execute DDL statements
  logger.info('ApplyBudgetTemplatesMigration', '⚠️  Note: This script requires admin/service role access');
  logger.info('ApplyBudgetTemplatesMigration', '');
  logger.info('ApplyBudgetTemplatesMigration', 'To apply the migration, please:');
  logger.info('ApplyBudgetTemplatesMigration', '1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa');
  logger.info('ApplyBudgetTemplatesMigration', '2. Navigate to SQL Editor');
  logger.info('ApplyBudgetTemplatesMigration', '3. Copy and paste the following SQL:');
  logger.info('ApplyBudgetTemplatesMigration', '');
  logger.info('ApplyBudgetTemplatesMigration', '='.repeat(80));
  logger.info('ApplyBudgetTemplatesMigration', migrationSQL);
  logger.info('ApplyBudgetTemplatesMigration', '='.repeat(80));
  logger.info('ApplyBudgetTemplatesMigration', '');
  logger.info('ApplyBudgetTemplatesMigration', '4. Click "Run" to execute the migration');
}

applyMigration();
