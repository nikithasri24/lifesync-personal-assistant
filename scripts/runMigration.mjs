#!/usr/bin/env node
/**
 * Script to run a specific migration file
 * Usage: node scripts/runMigration.mjs <migration-file>
 * Example: node scripts/runMigration.mjs 202511120003_improve_75hard_schema.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Usage: node scripts/runMigration.mjs <migration-file>');
  console.error('   Example: node scripts/runMigration.mjs 202511120003_improve_75hard_schema.sql');
  process.exit(1);
}

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

// Check if migration file exists
if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

console.log(`\n📝 Reading migration file: ${migrationFile}`);
const sql = fs.readFileSync(migrationPath, 'utf-8');

console.log(`📊 Migration file size: ${sql.length} characters`);
console.log(`\n🚀 Connecting to Supabase...`);

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log(`✅ Connected to Supabase at: ${SUPABASE_URL}`);
console.log(`\n⚡ Running migration...`);

try {
  // Execute the migration SQL
  // Note: Supabase JS client doesn't support raw SQL execution via RPC
  // We need to use the REST API directly
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    // If exec_sql doesn't exist, we need to use a different approach
    // Let's try using the SQL editor endpoint
    console.log('⚠️  Direct SQL execution via RPC not available');
    console.log('📋 Please run the migration manually via Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/<your-project>/sql/new');
    console.log('   2. Copy the contents of:');
    console.log(`      ${migrationPath}`);
    console.log('   3. Paste into SQL Editor and click "Run"');
    console.log('\n📄 Migration SQL Preview:');
    console.log('─'.repeat(80));
    console.log(sql.substring(0, 500) + (sql.length > 500 ? '\n... (truncated)' : ''));
    console.log('─'.repeat(80));
    process.exit(1);
  }

  console.log('✅ Migration executed successfully!');
  console.log('\n🎉 Database schema updated');

} catch (error) {
  console.error('❌ Error running migration:', error.message);
  console.log('\n📋 Manual Migration Required:');
  console.log('   1. Go to Supabase Dashboard SQL Editor');
  console.log('   2. Run the migration file manually:');
  console.log(`      ${migrationPath}`);
  process.exit(1);
}
