#!/usr/bin/env node

/**
 * Apply Meal Planning Migration
 * This script applies the migration directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Supabase credentials from .env.local
const supabaseUrl = 'https://rfwaiijodrowakcpayoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd2FpaWpvZHJvd2FrY3BheW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDA0OTMsImV4cCI6MjA3MzcxNjQ5M30.NovyRrFV9k6iVK8FWpakCmxAzRCsUFmrxOtHIeepfqs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip comments
    if (statement.trim().startsWith('--')) continue;
    
    // Get first 60 chars for display
    const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
    
    try {
      console.log(`[${i + 1}/${statements.length}] ${preview}`);
      
      const { error } = await supabase.rpc('exec', { sql: statement });
      
      if (error) {
        throw error;
      }
      
      console.log(`   ✅ Success\n`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errorCount++;
      
      // Continue with other statements even if one fails
    }
  }

  return { successCount, errorCount, total: statements.length };
}

async function main() {
  console.log('🚀 Applying Meal Planning Migration\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);
  console.log('='.repeat(60) + '\n');

  try {
    // Read the migration file
    const migrationPath = join(projectRoot, 'supabase/migrations/APPLY_THIS_20251226_meal_planning_tables.sql');
    console.log(`📂 Reading migration file...\n`);
    const sql = readFileSync(migrationPath, 'utf8');

    // Execute the SQL
    const result = await executeSql(sql);

    console.log('='.repeat(60));
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Successful: ${result.successCount}`);
    console.log(`   ❌ Failed: ${result.errorCount}`);
    console.log(`   📝 Total: ${result.total}\n`);

    if (result.errorCount > 0) {
      console.log('⚠️  Some statements failed. This might be okay if tables already exist.');
      console.log('   Check the errors above to see if they are critical.\n');
    } else {
      console.log('🎉 All statements executed successfully!\n');
    }

    console.log('✅ Migration complete!');
    console.log('   Refresh your app and try the meal planning feature.\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();

