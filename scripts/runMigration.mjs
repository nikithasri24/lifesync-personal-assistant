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
  logger.error('RunMigration', '❌ Missing Supabase credentials in .env file');
  logger.error('RunMigration', '   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  logger.error('RunMigration', '❌ Usage: node scripts/runMigration.mjs <migration-file>');
  logger.error('RunMigration', '   Example: node scripts/runMigration.mjs 202511120003_improve_75hard_schema.sql');
  process.exit(1);
}

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);

// Check if migration file exists
if (!fs.existsSync(migrationPath)) {
  logger.error('RunMigration', `❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

logger.info('RunMigration', `\n📝 Reading migration file: ${migrationFile}`);
const sql = fs.readFileSync(migrationPath, 'utf-8');

logger.info('RunMigration', `📊 Migration file size: ${sql.length} characters`);
logger.info('RunMigration', `\n🚀 Connecting to Supabase...`);

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

logger.info('RunMigration', `✅ Connected to Supabase at: ${SUPABASE_URL}`);
logger.info('RunMigration', `\n⚡ Running migration...`);

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
    logger.info('RunMigration', '⚠️  Direct SQL execution via RPC not available');
    logger.info('RunMigration', '📋 Please run the migration manually via Supabase Dashboard:');
    logger.info('RunMigration', '   1. Go to: https://supabase.com/dashboard/project/<your-project>/sql/new');
    logger.info('RunMigration', '   2. Copy the contents of:');
    logger.info('RunMigration', `      ${migrationPath}`);
    logger.info('RunMigration', '   3. Paste into SQL Editor and click "Run"');
    logger.info('RunMigration', '\n📄 Migration SQL Preview:');
    logger.info('RunMigration', '─'.repeat(80));
    logger.info('RunMigration', sql.substring(0, 500) + (sql.length > 500 ? '\n... (truncated)' : ''));
    logger.info('RunMigration', '─'.repeat(80));
    process.exit(1);
  }

  logger.info('RunMigration', '✅ Migration executed successfully!');
  logger.info('RunMigration', '\n🎉 Database schema updated');

} catch (error) {
  logger.error('RunMigration', '❌ Error running migration:', error.message);
  logger.info('RunMigration', '\n📋 Manual Migration Required:');
  logger.info('RunMigration', '   1. Go to Supabase Dashboard SQL Editor');
  logger.info('RunMigration', '   2. Run the migration file manually:');
  logger.info('RunMigration', `      ${migrationPath}`);
  process.exit(1);
}
