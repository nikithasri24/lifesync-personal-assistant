import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'lifesync',
  password: 'lifesync123',
  port: 5432,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 5,
});

console.log('Testing database connection...');

try {
  const result = await pool.query('SELECT NOW() as current_time, version() as version');
  console.log('✅ Database connection successful!');
  console.log('Current time:', result.rows[0].current_time);
  console.log('PostgreSQL version:', result.rows[0].version.split(' ')[1]);
  
  // Test tables
  const tablesResult = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  console.log('📊 Available tables:', tablesResult.rows.map(row => row.tablename));
  
  process.exit(0);
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
} finally {
  await pool.end();
}
