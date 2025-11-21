import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const logger = {
  debug: (domain, msg, ctx) => console.log(`[${domain}] ${msg}`, ctx || ''),
  info: (domain, msg, ctx) => console.log(`[${domain}] ${msg}`, ctx || ''),
  warn: (domain, msg, ctx) => console.warn(`[${domain}] ${msg}`, ctx || ''),
  error: (domain, err, ctx) => console.error(`[${domain}]`, err, ctx || ''),
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../backups');

const COLUMN_QUERY = `
  SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position
`;

const CONSTRAINT_QUERY = `
  SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_name = kcu.table_name
  WHERE tc.table_schema = 'public'
  ORDER BY tc.table_name, tc.constraint_name
`;

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function buildSnapshot(columns, constraints) {
  const byTable = {};
  for (const column of columns) {
    if (!byTable[column.table_name]) {
      byTable[column.table_name] = { columns: [], constraints: [] };
    }
    byTable[column.table_name].columns.push({
      name: column.column_name,
      type: column.data_type,
      nullable: column.is_nullable === 'YES',
      default: column.column_default,
      position: Number(column.ordinal_position),
    });
  }

  for (const constraint of constraints) {
    if (!byTable[constraint.table_name]) {
      byTable[constraint.table_name] = { columns: [], constraints: [] };
    }
    byTable[constraint.table_name].constraints.push({
      name: constraint.constraint_name,
      type: constraint.constraint_type,
      column: constraint.column_name,
    });
  }

  return byTable;
}

function writeSnapshot(snapshot) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .replace(/\.\d+Z$/, 'Z');
  const filename = path.join(OUTPUT_DIR, `supabase-schema-${timestamp}.json`);
  fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
  return filename;
}

async function main() {
  const connectionString =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_CONNECTION;

  if (!connectionString) {
    logger.error('BackupSupabaseSchema',
      'Set SUPABASE_DB_URL (or DATABASE_URL/POSTGRES_URL) to run the schema backup.'
    );
    process.exitCode = 1;
    return;
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
  } catch (error) {
    logger.error('BackupSupabaseSchema', 'Failed to connect to Supabase/Postgres:', error.message);
    process.exitCode = 1;
    return;
  }

  try {
    ensureOutputDir();
    const [columnsResult, constraintsResult] = await Promise.all([
      client.query(COLUMN_QUERY),
      client.query(CONSTRAINT_QUERY),
    ]);

    const snapshot = buildSnapshot(columnsResult.rows, constraintsResult.rows);
    const filename = writeSnapshot(snapshot);
    logger.info('BackupSupabaseSchema', `✅ Supabase schema snapshot saved to ${filename}`);
  } catch (error) {
    logger.error('BackupSupabaseSchema', 'Failed to create Supabase schema backup:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
