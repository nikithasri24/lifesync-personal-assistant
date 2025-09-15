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
  console.log('Testing connection to PostgreSQL...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL');
    
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('Version:', result.rows[0].version.split(' ')[0]);
    
    client.release();
    await pool.end();
    console.log('✅ Connection test completed successfully');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error details:', err);
    process.exit(1);
  }
}

testConnection();