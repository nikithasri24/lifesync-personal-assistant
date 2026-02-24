/**
 * Script to check the users table schema
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkSchema() {
  console.log('🔍 Checking users table schema...\n');

  // Get the existing user to see the schema
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'nikitha.lisi@gmail.com')
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log('✅ Found existing user:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n📋 Schema fields:');
  Object.keys(data).forEach(key => {
    console.log(`  - ${key}: ${typeof data[key]} ${data[key] === null ? '(null)' : ''}`);
  });
}

checkSchema();
