import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

export interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;
  DATABASE_URL: string;
  REDIS_URL?: string;
  DB_POOL_MAX?: string;
  DB_POOL_IDLE_TIMEOUT_MS?: string;
  DB_POOL_CONNECTION_TIMEOUT_MS?: string;
  DB_SSL?: string;
  JWT_SECRET: string;
  ADMIN_EMAILS?: string;
  ENABLE_SCHEDULAR: boolean;
}

const missing = (key: string): never => {
  throw new Error(`Missing required environment variable: ${key}`);
};

export const env: Env = {
  NODE_ENV: (process.env.NODE_ENV as Env['NODE_ENV']) ?? 'development',
  PORT: process.env.PORT ?? '3001',
  DATABASE_URL: process.env.DATABASE_URL ?? missing('DATABASE_URL'),
  REDIS_URL: process.env.REDIS_URL,
  ENABLE_SCHEDULAR: process.env.ENABLE_SCHEDULAR === 'true',
  DB_POOL_MAX: process.env.DB_POOL_MAX,
  DB_POOL_IDLE_TIMEOUT_MS: process.env.DB_POOL_IDLE_TIMEOUT_MS,
  DB_POOL_CONNECTION_TIMEOUT_MS: process.env.DB_POOL_CONNECTION_TIMEOUT_MS,
  DB_SSL: process.env.DB_SSL,
  JWT_SECRET: process.env.JWT_SECRET ?? missing('JWT_SECRET'),
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
};

const parseNumber = (
  value: string | undefined,
  fallback: number
): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isPrismaHostedDb = env.DATABASE_URL.includes('db.prisma.io');
const isNeonDb = new URL(env.DATABASE_URL).hostname.endsWith('.neon.tech');

const shouldUseSsl =
  isPrismaHostedDb ||
  isNeonDb ||
  env.DB_SSL === 'true' ||
  env.DB_SSL === '1';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,

  ssl: shouldUseSsl
    ? true
    : false,

  max: parseNumber(
    env.DB_POOL_MAX,
    env.NODE_ENV === 'production' ? 20 : 2
  ),

  idleTimeoutMillis: parseNumber(
    env.DB_POOL_IDLE_TIMEOUT_MS,
    env.NODE_ENV === 'production' ? 30_000 : 10_000
  ),

  connectionTimeoutMillis: parseNumber(
    env.DB_POOL_CONNECTION_TIMEOUT_MS,
    env.NODE_ENV === 'production' ? 10_000 : 15_000
  ),
});

pool.on('connect', () => {
  console.log('Database pool: new client connected');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle pool client:', err);
  process.exit(-1);
});
