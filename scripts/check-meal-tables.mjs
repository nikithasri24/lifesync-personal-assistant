#!/usr/bin/env node

/**
 * Check if meal planning tables exist in Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfwaiijodrowakcpayoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmd2FpaWpvZHJvd2FrY3BheW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNDA0OTMsImV4cCI6MjA3MzcxNjQ5M30.NovyRrFV9k6iVK8FWpakCmxAzRCsUFmrxOtHIeepfqs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return { exists: false, error: error.message };
      }
      return { exists: true, error: error.message };
    }
    
    return { exists: true, count: data?.length ?? 0 };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Checking Meal Planning Tables in Supabase\n');
  console.log(`📍 URL: ${supabaseUrl}\n`);
  console.log('='.repeat(60) + '\n');

  const tables = [
    'recipes',
    'recipe_ingredients',
    'meal_plans',
    'planned_meals',
    'pantry_items'
  ];

  const results = [];

  for (const table of tables) {
    process.stdout.write(`Checking ${table.padEnd(20)}... `);
    const result = await checkTable(table);
    results.push({ table, ...result });
    
    if (result.exists) {
      console.log(`✅ EXISTS`);
    } else {
      console.log(`❌ NOT FOUND`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:\n');

  const existing = results.filter(r => r.exists);
  const missing = results.filter(r => !r.exists);

  console.log(`✅ Existing tables: ${existing.length}/${tables.length}`);
  if (existing.length > 0) {
    existing.forEach(r => console.log(`   - ${r.table}`));
  }

  console.log(`\n❌ Missing tables: ${missing.length}/${tables.length}`);
  if (missing.length > 0) {
    missing.forEach(r => console.log(`   - ${r.table}`));
  }

  console.log('\n' + '='.repeat(60));

  if (missing.length > 0) {
    console.log('\n⚠️  Missing tables detected!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open: supabase/migrations/APPLY_THIS_20251226_meal_planning_tables.sql');
    console.log('   2. Go to: https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/sql/new');
    console.log('   3. Copy and paste the entire SQL file');
    console.log('   4. Click "Run"');
    console.log('   5. Run this script again to verify\n');
  } else {
    console.log('\n🎉 All tables exist!');
    console.log('   The meal planning feature should work.\n');
  }
}

main();

