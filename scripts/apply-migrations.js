#!/usr/bin/env node

/**
 * Apply database migrations to Supabase
 * 
 * This script reads the combined migration file and applies it to your Supabase database.
 * 
 * Usage:
 *   node scripts/apply-migrations.js
 * 
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable (get from Supabase Dashboard)
 *   - Or run the SQL manually in Supabase Dashboard SQL Editor
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://rfwaiijodrowakcpayoa.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('To get your service role key:');
  console.error('1. Go to https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/settings/api');
  console.error('2. Copy the "service_role" key (NOT the anon key)');
  console.error('3. Run: SUPABASE_SERVICE_ROLE_KEY=your_key_here node scripts/apply-migrations.js');
  console.error('');
  console.error('OR use the Supabase Dashboard SQL Editor (easier):');
  console.error('1. Go to https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/editor');
  console.error('2. Open SQL Editor');
  console.error('3. Copy contents of: supabase/migrations/APPLY_THIS_20251226_combined_migrations.sql');
  console.error('4. Paste and click "Run"');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrations() {
  console.log('🚀 Starting migration process...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', 'APPLY_THIS_20251226_combined_migrations.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log(`   File: ${migrationPath}`);
    console.log(`   Size: ${migrationSQL.length} characters\n`);

    // Execute the migration
    console.log('⏳ Executing migration...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Verification:');
    console.log('   - pending_email_invitations table created');
    console.log('   - lookup_user_by_email function created');
    console.log('   - process_pending_invitations_on_signup trigger created\n');
    console.log('🎉 You can now invite users who don\'t have accounts yet!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.error('\n💡 Try applying the migration manually:');
    console.error('1. Go to https://supabase.com/dashboard/project/rfwaiijodrowakcpayoa/editor');
    console.error('2. Open SQL Editor');
    console.error('3. Copy contents of: supabase/migrations/APPLY_THIS_20251226_combined_migrations.sql');
    console.error('4. Paste and click "Run"');
    process.exit(1);
  }
}

applyMigrations();

