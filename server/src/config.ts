import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET', 'dev-insecure-secret-change-me'),
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS ?? 168),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  // Supabase Postgres (IPv4 session-mode pooler).
  // Values are trimmed to survive stray whitespace/tabs from copy-paste in host dashboards.
  db: {
    host: required('SUPABASE_DB_HOST').trim(),
    port: Number(String(process.env.SUPABASE_DB_PORT ?? 5432).trim()),
    user: required('SUPABASE_DB_USER').trim(),
    password: required('SUPABASE_DB_PASSWORD').trim(),
    name: (process.env.SUPABASE_DB_NAME ?? 'postgres').trim(),
  },
} as const;
