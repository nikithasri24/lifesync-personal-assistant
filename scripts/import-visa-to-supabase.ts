/**
 * Direct Visa Requirements Import to Supabase
 *
 * Imports visa requirements data directly to Supabase using the client SDK
 * in batches to avoid query size limits
 *
 * Usage:
 *   npx tsx scripts/import-visa-to-supabase.ts
 *
 * Environment variables required:
 *   VITE_SUPABASE_URL - Your Supabase project URL
 *   VITE_SUPABASE_ANON_KEY - Your Supabase anon key
 */

import { createClient } from '@supabase/supabase-js';
import { visaRequirements } from '../src/travel/data/visaRequirements';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - try .env.local first, then .env
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  console.error('\nMake sure your .env file has these variables set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface VisaEntry {
  passport_country: string;
  destination_country: string;
  requirement: string;
  days_allowed: number | null;
}

async function importVisaData() {
  console.log('🚀 Starting visa requirements import to Supabase...\n');

  // Convert nested object to flat array
  const entries: VisaEntry[] = [];

  for (const [passportCountry, destinations] of Object.entries(visaRequirements)) {
    for (const [destinationCountry, data] of Object.entries(destinations)) {
      entries.push({
        passport_country: passportCountry,
        destination_country: destinationCountry,
        requirement: data.requirement,
        days_allowed: data.daysAllowed || null,
      });
    }
  }

  console.log(`📊 Total entries to import: ${entries.length.toLocaleString()}`);
  console.log(`📊 Entries with days_allowed: ${entries.filter(e => e.days_allowed).length.toLocaleString()}\n`);

  // Import in batches (Supabase recommends max 1000 rows per batch)
  const batchSize = 1000;
  const totalBatches = Math.ceil(entries.length / batchSize);
  let successCount = 0;
  let errorCount = 0;

  console.log(`⚙️  Importing in ${totalBatches} batches of ${batchSize} rows...\n`);

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    try {
      const { error } = await supabase
        .from('visa_requirements')
        .upsert(batch, {
          onConflict: 'passport_country,destination_country',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`❌ Batch ${batchNumber}/${totalBatches} failed:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        const progress = ((successCount / entries.length) * 100).toFixed(1);
        console.log(`✅ Batch ${batchNumber}/${totalBatches} imported (${progress}% complete)`);
      }
    } catch (error) {
      console.error(`❌ Batch ${batchNumber}/${totalBatches} error:`, error);
      errorCount += batch.length;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount.toLocaleString()} entries`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount.toLocaleString()} entries`);
  }
  console.log('='.repeat(60));

  // Verify data in database
  console.log('\n🔍 Verifying import...');
  const { count, error: countError } = await supabase
    .from('visa_requirements')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Verification failed:', countError.message);
  } else {
    console.log(`✅ Database contains ${count?.toLocaleString()} total entries`);

    if (count === entries.length) {
      console.log('✅ Import successful! All entries verified.\n');
    } else {
      console.log(`⚠️  Expected ${entries.length}, found ${count}. Some entries may be missing.\n`);
    }
  }
}

// Run the import
importVisaData()
  .then(() => {
    console.log('🎉 Import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
