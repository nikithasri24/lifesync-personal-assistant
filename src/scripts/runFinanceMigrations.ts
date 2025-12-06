/**
 * Script to run finance migrations directly via Supabase client
 * Run with: npx tsx src/scripts/runFinanceMigrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

async function runMigration(sqlFilePath: string) {
  console.log(`\n📄 Reading migration: ${path.basename(sqlFilePath)}`);

  const sql = fs.readFileSync(sqlFilePath, 'utf-8');

  console.log(`📊 SQL length: ${sql.length} characters`);
  console.log(`🚀 Executing migration...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      throw error;
    }

    console.log(`✅ Migration completed successfully!`);
    return true;
  } catch (error: any) {
    // If RPC doesn't exist, try using the SQL editor endpoint directly
    console.log(`⚠️  RPC method not available, trying direct execution...`);

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

      console.log(`✅ Migration completed successfully!`);
      return true;
    } catch (fetchError: any) {
      console.error(`❌ Migration failed:`, fetchError.message);
      return false;
    }
  }
}

async function main() {
  console.log('🔧 Finance Database Migration Runner\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Using API key: ${SUPABASE_SERVICE_KEY.substring(0, 20)}...`);

  const migrationsDir = path.join(__dirname, '../../supabase/migrations');

  const migrations = [
    '20250115_finance_init.sql',
    '20250116_categorization_rules.sql'
  ];

  console.log(`\n📁 Migrations directory: ${migrationsDir}`);
  console.log(`📋 Migrations to run: ${migrations.length}\n`);

  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      process.exit(1);
    }

    const success = await runMigration(filePath);

    if (!success) {
      console.error(`\n❌ Migration failed: ${migration}`);
      console.error(`\n💡 Please run the SQL manually in Supabase Dashboard → SQL Editor`);
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations completed successfully!');
  console.log('\n🎉 Finance schema is ready!');
  console.log('\n📝 Next steps:');
  console.log('   1. Create an account and categories');
  console.log('   2. Add test transactions');
  console.log('   3. Try auto-categorization!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
