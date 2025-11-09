import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const defaultEnvFile = path.resolve(process.cwd(), 'server/.env');
const overridesEnvFile = process.env.LIFESYNC_ENV_FILE
  ? path.resolve(process.cwd(), process.env.LIFESYNC_ENV_FILE)
  : undefined;

const envFileToLoad = overridesEnvFile ?? (fs.existsSync(defaultEnvFile) ? defaultEnvFile : undefined);

if (envFileToLoad) {
  loadEnv({ path: envFileToLoad });
} else {
  loadEnv();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  CORS_ORIGINS: z.string().default(''),
  LOG_LEVEL: z.string().default('info'),
  DEFAULT_USER_ID: z.string().uuid().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DB_SSL: z
    .union([
      z.boolean(),
      z
        .string()
        .transform((value) => value === 'true' || value === '1')
    ])
    .default(false)
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  LOG_LEVEL: process.env.LOG_LEVEL,
  DEFAULT_USER_ID: process.env.DEFAULT_USER_ID,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DB_SSL: process.env.DB_SSL
});

if (!parsed.success) {
  console.error('❌ Invalid environment configuration');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const { CORS_ORIGINS, DB_SSL, ...rest } = parsed.data;

export const env = {
  ...rest,
  dbSsl: Boolean(DB_SSL),
  corsOrigins: CORS_ORIGINS
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
};
