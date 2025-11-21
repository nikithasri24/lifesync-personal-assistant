const logger = {
  debug: (domain, msg, ctx) => console.log(`[${domain}] ${msg}`, ctx || ''),
  info: (domain, msg, ctx) => console.log(`[${domain}] ${msg}`, ctx || ''),
  warn: (domain, msg, ctx) => console.warn(`[${domain}] ${msg}`, ctx || ''),
  error: (domain, err, ctx) => console.error(`[${domain}]`, err, ctx || ''),
};

// Test PostgreSQL connection
import { Pool } from 'pg';

const pool = new Pool({
  user: 'lifesync_user',
  host: '127.0.0.1',
  database: 'lifesync_db',
  password: 'lifesync_password',
  port: 5432,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  logger.info('TestDbConnection', 'Testing connection to PostgreSQL...');
  
  try {
    const client = await pool.connect();
    logger.info('TestDbConnection', '✅ Successfully connected to PostgreSQL');
    
    const result = await client.query('SELECT current_database(), current_user, version()');
    logger.info('TestDbConnection', 'Database:', result.rows[0].current_database);
    logger.info('TestDbConnection', 'User:', result.rows[0].current_user);
    logger.info('TestDbConnection', 'Version:', result.rows[0].version.split(' ')[0]);
    
    client.release();
    await pool.end();
    logger.info('TestDbConnection', '✅ Connection test completed successfully');
  } catch (err) {
    logger.error('TestDbConnection', '❌ Connection failed:', err.message);
    logger.error('TestDbConnection', 'Error details:', err);
    process.exit(1);
  }
}

testConnection();