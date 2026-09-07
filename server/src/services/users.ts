import { one, exec } from '../db/connection.js';
import { nowIso } from '../lib/time.js';

export interface UserRow {
  id: string;
  email: string;
  email_lower: string;
  password_hash: string;
  password_salt: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Public shape (never exposes hash/salt) — Req 1.7. */
export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export function findUserByEmail(email: string): Promise<UserRow | undefined> {
  return one<UserRow>('SELECT * FROM users WHERE email_lower = ?', [email.trim().toLowerCase()]);
}

export function findUserById(id: string): Promise<UserRow | undefined> {
  return one<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
}

/** Creates the default settings row for a user (Req 17). */
export async function ensureUserSettings(userId: string): Promise<void> {
  const exists = await one('SELECT user_id FROM user_settings WHERE user_id = ?', [userId]);
  if (!exists) {
    await exec('INSERT INTO user_settings (user_id, updated_at) VALUES (?, ?)', [userId, nowIso()]);
  }
}
