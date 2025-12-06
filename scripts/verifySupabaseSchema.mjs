import { Client } from 'pg';

const logger = {
  debug: (domain, msg, ctx) => console.log(`[${domain}] ${msg}`, ctx || ''),
  info: (domain, msg, ctx) => console.log(`[${domain}] ${msg}`, ctx || ''),
  warn: (domain, msg, ctx) => console.warn(`[${domain}] ${msg}`, ctx || ''),
  error: (domain, err, ctx) => console.error(`[${domain}]`, err, ctx || ''),
};

const REQUIRED_COLUMNS = {
  habits: [
    'goal_mode',
    'goal_target',
    'goal_unit',
    'current_progress',
    'streak_count',
    'best_streak',
  ],
  habit_entries: ['value'],
};

const EXTRA_CHECKS = [
  {
    table: 'habit_entries',
    constraintName: 'habit_entries_habit_id_date_key',
    query: `
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'habit_entries_habit_id_date_key'
        AND conrelid = 'public.habit_entries'::regclass
    `,
    message: 'Missing unique constraint on habit_entries(habit_id, date)',
  },
];

const formatIssue = (type, table, detail) => ({ type, table, detail });

async function checkColumns(client) {
  const issues = [];
  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    const defined = new Set(rows.map((row) => row.column_name));
    columns.forEach((column) => {
      if (!defined.has(column)) {
        issues.push(
          formatIssue(
            'missing-column',
            table,
            `Column "${column}" is missing from ${table}`,
          ),
        );
      }
    });
  }
  return issues;
}

async function checkConstraints(client) {
  const issues = [];
  for (const rule of EXTRA_CHECKS) {
    const { rows } = await client.query(rule.query);
    if (rows.length === 0) {
      issues.push(formatIssue('missing-constraint', rule.table, rule.message));
    }
  }
  return issues;
}

function printSummary(issues, durationMs) {
  if (issues.length === 0) {
    logger.info('VerifySupabaseSchema', `✅ Supabase schema verification passed (${durationMs}ms)`);
    return;
  }

  logger.error('VerifySupabaseSchema', `\n❌ Supabase schema verification failed (${durationMs}ms)`);
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.table]) acc[issue.table] = [];
    acc[issue.table].push(issue);
    return acc;
  }, {});

  for (const [table, tableIssues] of Object.entries(grouped)) {
    logger.error('VerifySupabaseSchema', `\n${table}:`);
    tableIssues.forEach((issue) => {
      logger.error('VerifySupabaseSchema', `  - ${issue.detail}`);
    });
  }
}

async function main() {
  const start = Date.now();
  const connectionString =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_CONNECTION;

  if (!connectionString) {
    logger.error('VerifySupabaseSchema',
      'Set SUPABASE_DB_URL (or DATABASE_URL/POSTGRES_URL) to run the schema verifier.'
    );
    process.exitCode = 1;
    return;
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
  } catch (error) {
    logger.error('VerifySupabaseSchema', 'Failed to connect to Supabase/Postgres:', error.message);
    process.exitCode = 1;
    return;
  }

  try {
    const [columnIssues, constraintIssues] = await Promise.all([
      checkColumns(client),
      checkConstraints(client),
    ]);

    const issues = [...columnIssues, ...constraintIssues];
    printSummary(issues, Date.now() - start);
    if (issues.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    logger.error('VerifySupabaseSchema', 'Schema verification failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
