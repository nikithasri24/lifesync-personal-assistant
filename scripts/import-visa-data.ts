/**
 * Visa Requirements Data Import Script
 *
 * Converts src/travel/data/visaRequirements.ts to SQL INSERT statements
 * and imports into Supabase visa_requirements table
 *
 * Usage:
 *   npx tsx scripts/import-visa-data.ts
 *
 * This will:
 * 1. Parse the TypeScript visa requirements data
 * 2. Generate SQL INSERT statements
 * 3. Save to supabase/migrations/20260216_150001_import_visa_data.sql
 * 4. Import directly to Supabase (if --import flag is passed)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the visa requirements data
import { visaRequirements } from '../src/travel/data/visaRequirements';

interface VisaEntry {
  passportCountry: string;
  destinationCountry: string;
  requirement: string;
  daysAllowed?: number;
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function generateInsertStatements(): string[] {
  const entries: VisaEntry[] = [];

  // Convert nested object to flat array
  for (const [passportCountry, destinations] of Object.entries(visaRequirements)) {
    for (const [destinationCountry, data] of Object.entries(destinations)) {
      entries.push({
        passportCountry,
        destinationCountry,
        requirement: data.requirement,
        daysAllowed: data.daysAllowed
      });
    }
  }

  console.log(`📊 Total entries: ${entries.length.toLocaleString()}`);
  console.log(`📊 Entries with days_allowed: ${entries.filter(e => e.daysAllowed).length.toLocaleString()}`);

  // Generate SQL in batches for better performance
  const batchSize = 1000;
  const sqlStatements: string[] = [];

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const values = batch.map(entry => {
      const daysAllowed = entry.daysAllowed ? entry.daysAllowed : 'NULL';
      return `('${escapeSQL(entry.passportCountry)}', '${escapeSQL(entry.destinationCountry)}', '${entry.requirement}', ${daysAllowed})`;
    });

    const sql = `INSERT INTO visa_requirements (passport_country, destination_country, requirement, days_allowed)
VALUES
${values.join(',\n')}
ON CONFLICT (passport_country, destination_country) DO UPDATE
SET requirement = EXCLUDED.requirement,
    days_allowed = EXCLUDED.days_allowed,
    updated_at = now();`;

    sqlStatements.push(sql);
  }

  return sqlStatements;
}

function main() {
  console.log('🚀 Starting visa requirements data import...\n');

  // Generate SQL statements
  const sqlStatements = generateInsertStatements();

  // Combine into single migration file
  const header = `-- Visa Requirements Data Import
-- Generated: ${new Date().toISOString()}
-- Source: src/travel/data/visaRequirements.ts
-- Total entries: ${Object.values(visaRequirements).reduce((sum, dest) => sum + Object.keys(dest).length, 0)}
--
-- This file imports all visa requirement data into the database
-- Run this after running 20260216_150000_add_visa_requirements.sql

`;

  const fullSQL = header + sqlStatements.join('\n\n');

  // Save to migration file
  const outputPath = path.join(
    __dirname,
    '../supabase/migrations/20260216_150001_import_visa_data.sql'
  );

  fs.writeFileSync(outputPath, fullSQL, 'utf-8');

  console.log(`\n✅ SQL migration file created: ${outputPath}`);
  console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review the generated SQL file`);
  console.log(`   2. Run migration: supabase db push (if using local dev)`);
  console.log(`   3. Or apply via Supabase Dashboard > SQL Editor`);
  console.log(`   4. After successful import, update API layer to use database queries`);
}

main();
