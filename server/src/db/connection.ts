import pg from 'pg';
import { config } from '../config.js';

// Ensure numeric/bigint columns come back as JS numbers (COUNT returns bigint).
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v))); // int8
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v))); // numeric

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (pool) return pool;
  pool = new pg.Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  });
  return pool;
}

/** Converts SQLite-style `?` placeholders to Postgres `$1, $2, ...`. */
function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

type Params = ReadonlyArray<unknown>;

/** Run a query, return all rows. */
export async function query<T = Record<string, unknown>>(sql: string, params: Params = []): Promise<T[]> {
  const res = await getPool().query(toPg(sql), params as unknown[]);
  return res.rows as T[];
}

/** Run a query, return the first row (or undefined). */
export async function one<T = Record<string, unknown>>(sql: string, params: Params = []): Promise<T | undefined> {
  const res = await getPool().query(toPg(sql), params as unknown[]);
  return res.rows[0] as T | undefined;
}

/** Run a statement, return affected row count. */
export async function exec(sql: string, params: Params = []): Promise<number> {
  const res = await getPool().query(toPg(sql), params as unknown[]);
  return res.rowCount ?? 0;
}

/**
 * Run fn inside a transaction on a dedicated client. Placeholder conversion is
 * applied here too via the provided `q` helper.
 */
export interface TxClient {
  query<T = Record<string, unknown>>(sql: string, params?: Params): Promise<T[]>;
  one<T = Record<string, unknown>>(sql: string, params?: Params): Promise<T | undefined>;
  exec(sql: string, params?: Params): Promise<number>;
}

export async function tx<T>(fn: (c: TxClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  const wrapped: TxClient = {
    async query<R = Record<string, unknown>>(sql: string, params: Params = []) {
      const r = await client.query(toPg(sql), params as unknown[]);
      return r.rows as R[];
    },
    async one<R = Record<string, unknown>>(sql: string, params: Params = []) {
      const r = await client.query(toPg(sql), params as unknown[]);
      return r.rows[0] as R | undefined;
    },
    async exec(sql: string, params: Params = []) {
      const r = await client.query(toPg(sql), params as unknown[]);
      return r.rowCount ?? 0;
    },
  };
  try {
    await client.query('BEGIN');
    const result = await fn(wrapped);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
