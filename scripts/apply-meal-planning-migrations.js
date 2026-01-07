#!/usr/bin/env node

/**
 * Apply Meal Planning Migrations
 * 
 * This script applies the meal planning table migrations to the Supabase database.
 * Run with: node scripts/apply-meal-planning-migrations.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(filePath, description) {
  console.log(`\n📝 Applying: ${description}`);
  console.log(`   File: ${filePath}`);
  
  try {
    const sql = readFileSync(filePath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution (this won't work for all statements)
      console.log('   ⚠️  exec_sql RPC not available, trying alternative method...');
      
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
        if (stmtError) {
          throw stmtError;
        }
      }
    }
    
    console.log('   ✅ Success!');
    return true;
  } catch (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Applying Meal Planning Migrations\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  const migrations = [
    {
      file: join(projectRoot, 'supabase/migrations/20251226000010_create_meal_planning_tables.sql'),
      description: 'Create meal planning tables (recipes, meal_plans, planned_meals)'
    },
    {
      file: join(projectRoot, 'supabase/migrations/20251226000011_meal_planning_rls_policies.sql'),
      description: 'Add RLS policies for meal planning tables'
    }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration.file, migration.description);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(60));
  
  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. Please apply them manually via Supabase Dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy and paste the SQL from the migration files');
    process.exit(1);
  } else {
    console.log('\n🎉 All migrations applied successfully!');
    console.log('   You can now use the meal planning feature.');
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

