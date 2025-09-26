import { Pool } from 'pg';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL client error');
});

export type DbClient = typeof pool extends { connect: () => Promise<infer Client> } ? Awaited<Client> : never;

export async function withTransaction<T>(handler: (client: DbClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
