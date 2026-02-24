/**
 * Script to fix test account user profiles
 * Creates missing user profiles in the public.users table for test accounts
 * This fixes the foreign key constraint violation for habits and other features
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL environment variable');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('   This script requires the service role key to access auth.users');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixTestUserProfiles() {
  console.log('🔧 Fixing test user profiles...\n');

  try {
    // Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Failed to list auth users:', authError.message);
      process.exit(1);
    }

    const authUsers = authData.users;
    console.log(`📋 Found ${authUsers.length} auth users\n`);

    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const authUser of authUsers) {
      console.log(`Checking user: ${authUser.email} (${authUser.id})`);

      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (checkError) {
        console.error(`  ❌ Error checking profile: ${checkError.message}`);
        errors++;
        continue;
      }

      if (existingProfile) {
        console.log(`  ✅ Profile already exists`);
        existing++;
        continue;
      }

      // Create the profile
      console.log(`  📝 Creating profile...`);

      // Generate username from email (take part before @)
      const username = authUser.email?.split('@')[0] || `user_${authUser.id.substring(0, 8)}`;

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          username: username,
          email: authUser.email,
          password_hash: 'managed-by-supabase',
          timezone: 'UTC',
          date_format: 'YYYY-MM-DD',
          theme: 'light',
          language: 'en',
          is_active: true,
          email_verified: true,
          created_at: authUser.created_at,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(`  ❌ Failed to create profile: ${insertError.message}`);
        errors++;
      } else {
        console.log(`  ✅ Profile created successfully!`);
        created++;
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log('📊 Summary:');
    console.log(`   ✅ Profiles created: ${created}`);
    console.log(`   ℹ️  Already existing: ${existing}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('═══════════════════════════════════════\n');

    if (errors === 0) {
      console.log('✨ All test user profiles are now set up correctly!');
      console.log('   You can now run the habit creation tests.\n');
    } else {
      console.log('⚠️  Some errors occurred. Please check the output above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

fixTestUserProfiles();
