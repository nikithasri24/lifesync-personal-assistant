#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

async function applyMigration() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Read the migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251117_add_budget_templates.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log('📝 Applying budget templates migration...');
  console.log('Migration file:', migrationPath);
  console.log('');

  // Note: This requires using the service role key or a user with sufficient privileges
  // The anon key won't have permission to execute DDL statements
  console.log('⚠️  Note: This script requires admin/service role access');
  console.log('');
  console.log('To apply the migration, please:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the following SQL:');
  console.log('');
  console.log('='.repeat(80));
  console.log(migrationSQL);
  console.log('='.repeat(80));
  console.log('');
  console.log('4. Click "Run" to execute the migration');
}

applyMigration();
