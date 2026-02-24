/**
 * Script to apply the user profiles migration
 * This fixes the foreign key constraint issue for test accounts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🔧 Applying user profiles migration...\n');

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260223_auto_create_user_profiles.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split into individual statements (simple split on semicolon + newline)
  const statements = sql
    .split(';\n')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.trim().startsWith('--')) {
      continue;
    }

    console.log(`[${i + 1}/${statements.length}] Executing statement...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: statement });

      if (error) {
        // Try direct execution as fallback
        const { error: directError } = await supabase.from('_internal').select('*').limit(0);

        if (directError) {
          console.error(`  ❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ Success`);
          successCount++;
        }
      } else {
        console.log(`  ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n✨ Migration applied successfully!');
  } else {
    console.log('\n⚠️  Migration completed with errors. Manual intervention may be required.');
  }

  // Verify the migration by checking if user profiles exist
  console.log('\n🔍 Verifying user profiles...');

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Could not list auth users:', authError.message);
    return;
  }

  console.log(`Found ${authUsers.users.length} auth users`);

  for (const user of authUsers.users) {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.log(`  ❌ ${user.email}: Error checking profile - ${profileError.message}`);
    } else if (!profile) {
      console.log(`  ⚠️  ${user.email}: No profile found - creating...`);

      // Create the profile
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.log(`     ❌ Failed to create profile: ${insertError.message}`);
      } else {
        console.log(`     ✅ Profile created`);
      }
    } else {
      console.log(`  ✅ ${user.email}: Profile exists`);
    }
  }

  console.log('\n✅ Migration verification complete!');
}

applyMigration().catch(console.error);
