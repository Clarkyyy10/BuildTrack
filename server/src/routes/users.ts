import { Router } from 'express';
import { z } from 'zod';
import { one, exec, query } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { nowIso } from '../lib/time.js';
import { notFound } from '../lib/errors.js';
import {
  ensureUserSettings,
  findUserById,
  toPublicUser,
} from '../services/users.js';

export const meRouter = Router();
export const usersRouter = Router();

/** Current user + their settings. */
meRouter.get('/', requireAuth, ah(async (req, res) => {
  const user = await findUserById(req.auth!.userId);
  if (!user) throw notFound('Your account could not be found.');
  await ensureUserSettings(user.id);
  const settings = await one('SELECT * FROM user_settings WHERE user_id = ?', [user.id]);
  res.json({ user: toPublicUser(user), settings });
}));

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(1_500_000)
    .nullable()
    .optional()
    .refine(
      (v) => v == null || v === '' || /^https?:\/\//i.test(v) || /^data:image\//i.test(v),
      'Avatar must be an image URL or an uploaded image.',
    ),
});

/** Update profile — never the immutable User ID (Req 2.1, 2.3). */
meRouter.patch('/', requireAuth, validateBody(profileSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof profileSchema>;
  const user = await findUserById(req.auth!.userId);
  if (!user) throw notFound('Your account could not be found.');

  const sets: string[] = [];
  const values: Array<string | null> = [];
  if (body.displayName !== undefined) { sets.push('display_name = ?'); values.push(body.displayName); }
  if ('avatarUrl' in body) { sets.push('avatar_url = ?'); values.push(body.avatarUrl ? body.avatarUrl : null); }
  if (sets.length > 0) {
    values.push(nowIso(), user.id);
    await exec(`UPDATE users SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`, values);
  }

  res.json({ user: toPublicUser((await findUserById(user.id))!) });
}));

/** User search by name or ID — returns IDs so callers select by ID (Req 2.2, 5.1). */
usersRouter.get('/', requireAuth, ah(async (req, res) => {
  const q = String(req.query.query ?? '').trim();
  if (q.length < 2) return res.json({ users: [] });
  const like = `%${q.toLowerCase()}%`;
  const rows = await query<{
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
    created_at: string;
  }>(
    `SELECT id, email, display_name, avatar_url, created_at
     FROM users
     WHERE lower(display_name) LIKE ? OR lower(id) LIKE ? OR email_lower LIKE ?
     ORDER BY display_name LIMIT 20`,
    [like, like, like],
  );
  res.json({
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      createdAt: r.created_at,
    })),
  });
}));
