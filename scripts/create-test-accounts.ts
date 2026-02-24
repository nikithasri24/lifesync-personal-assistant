#!/usr/bin/env tsx
/**
 * Script to create test accounts for LifeSync
 *
 * Usage: npm run create-test-accounts
 *
 * Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please ensure .env.local contains:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test account configurations
const testAccounts = [
  {
    email: 'test1@lifesync.app',
    password: 'TestAccount123!',
    metadata: {
      full_name: 'Test User 1',
      display_name: 'Test User 1',
    },
  },
  {
    email: 'test2@lifesync.app',
    password: 'TestAccount456!',
    metadata: {
      full_name: 'Test User 2',
      display_name: 'Test User 2',
    },
  },
];

async function createTestAccounts() {
  console.log('🚀 Creating test accounts for LifeSync...\n');

  const results: Array<{ email: string; password: string; success: boolean; error?: string }> = [];

  for (const account of testAccounts) {
    try {
      console.log(`Creating account: ${account.email}`);

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: account.metadata,
      });

      if (error) {
        // Check if user already exists
        if (error.message.includes('already registered')) {
          console.log(`⚠️  Account already exists: ${account.email}`);
          results.push({
            email: account.email,
            password: account.password,
            success: true,
            error: 'Already exists',
          });
        } else {
          throw error;
        }
      } else {
        console.log(`✅ Successfully created: ${account.email}`);
        results.push({
          email: account.email,
          password: account.password,
          success: true,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`❌ Failed to create ${account.email}: ${errorMessage}`);
      results.push({
        email: account.email,
        password: account.password,
        success: false,
        error: errorMessage,
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 Test Accounts Summary');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    console.log('✅ Available Test Accounts:\n');
    successful.forEach((result, index) => {
      console.log(`Account ${index + 1}:`);
      console.log(`  Email:    ${result.email}`);
      console.log(`  Password: ${result.password}`);
      if (result.error) {
        console.log(`  Note:     ${result.error}`);
      }
      console.log('');
    });
  }

  if (failed.length > 0) {
    console.log('❌ Failed Accounts:\n');
    failed.forEach((result) => {
      console.log(`  ${result.email}: ${result.error}`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`Total: ${successful.length} successful, ${failed.length} failed`);
  console.log('='.repeat(60) + '\n');

  console.log('💡 You can now use these credentials to sign in to LifeSync');
  console.log('   Run: npm run dev');
  console.log('   Then navigate to http://localhost:5173\n');
}

createTestAccounts()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });
