import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool, closeDb } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DROP_ORDER = [
  'notifications', 'audit_logs', 'daily_records', 'personnel_assignments',
  'schedule_activities', 'budget_changes', 'expenses', 'material_transactions',
  'materials', 'project_components', 'project_invitations', 'project_members',
  'projects', 'user_settings', 'password_resets', 'sessions', 'users', 'id_sequences',
];

async function migrate(reset: boolean): Promise<void> {
  const pool = getPool();
  if (reset) {
    for (const t of DROP_ORDER) {
      await pool.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
    }
    console.log('Reset: dropped existing tables.');
  }

  const schema = fs.readFileSync(path.join(__dirname, 'schema.pg.sql'), 'utf8');
  await pool.query(schema);
  console.log('Schema applied to Supabase Postgres.');
  await closeDb();
}

const reset = process.argv.includes('--reset');
migrate(reset).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
