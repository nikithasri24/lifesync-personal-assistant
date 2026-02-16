/**
 * Export Visa Requirements to CSV
 *
 * Generates a CSV file from visa requirements data
 * Can be imported via Supabase Dashboard > Table Editor > Import CSV
 *
 * Usage:
 *   npx tsx scripts/export-visa-to-csv.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { visaRequirements } from '../src/travel/data/visaRequirements';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // Escape double quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV(): string {
  const rows: string[] = [];

  // Header
  rows.push('passport_country,destination_country,requirement,days_allowed');

  // Data rows
  for (const [passportCountry, destinations] of Object.entries(visaRequirements)) {
    for (const [destinationCountry, data] of Object.entries(destinations)) {
      const row = [
        escapeCSV(passportCountry),
        escapeCSV(destinationCountry),
        escapeCSV(data.requirement),
        escapeCSV(data.daysAllowed || null),
      ].join(',');
      rows.push(row);
    }
  }

  return rows.join('\n');
}

function main() {
  console.log('🚀 Exporting visa requirements to CSV...\n');

  const csv = generateCSV();
  const outputPath = path.join(__dirname, '../visa_requirements.csv');

  fs.writeFileSync(outputPath, csv, 'utf-8');

  const stats = fs.statSync(outputPath);
  const lines = csv.split('\n').length - 1; // Subtract header

  console.log(`✅ CSV file created: ${outputPath}`);
  console.log(`📦 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📊 Total entries: ${lines.toLocaleString()}\n`);

  console.log('📝 Next steps:');
  console.log('   1. Go to Supabase Dashboard > Table Editor');
  console.log('   2. Select "visa_requirements" table');
  console.log('   3. Click "Insert" > "Import data via spreadsheet"');
  console.log('   4. Upload visa_requirements.csv');
  console.log('   5. Map columns: passport_country → passport_country, etc.');
  console.log('   6. Import (may take 1-2 minutes)');
}

main();
