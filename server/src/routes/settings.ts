import { Router } from 'express';
import { z } from 'zod';
import { one, exec } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { nowIso } from '../lib/time.js';
import { ensureUserSettings } from '../services/users.js';

export const settingsRouter = Router();

settingsRouter.get('/', requireAuth, ah(async (req, res) => {
  await ensureUserSettings(req.auth!.userId);
  const settings = await one('SELECT * FROM user_settings WHERE user_id = ?', [req.auth!.userId]);
  res.json({ settings });
}));

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  dark_theme: z.enum(['warm', 'neutral', 'slate', 'midnight', 'black']).optional(),
  accent: z.string().trim().max(40).optional(),
  font: z.string().trim().max(60).optional(),
  density: z.enum(['comfortable', 'compact']).optional(),
  sidebar_behavior: z.enum(['expanded', 'collapsed']).optional(),
  default_project_page: z.string().trim().max(40).optional(),
  table_density: z.enum(['comfortable', 'compact']).optional(),
  profile_visibility: z.enum(['members', 'private', 'public']).optional(),
  show_online: z.boolean().optional(),
  show_last_active: z.boolean().optional(),
  font_scale: z.number().min(0.75).max(2).optional(),
  high_contrast: z.boolean().optional(),
  reduced_motion: z.boolean().optional(),
  screen_reader_hint: z.boolean().optional(),
  language: z.string().trim().max(10).optional(),
  region: z.string().trim().max(10).optional(),
});

const ALLOWED = new Set(Object.keys(settingsSchema.shape));
const BOOLEAN_KEYS = new Set(['show_online', 'show_last_active', 'high_contrast', 'reduced_motion', 'screen_reader_hint']);

settingsRouter.patch('/', requireAuth, validateBody(settingsSchema), ah(async (req, res) => {
  await ensureUserSettings(req.auth!.userId);
  const body = req.body as Record<string, unknown>;
  const entries = Object.entries(body).filter(([k]) => ALLOWED.has(k));
  if (entries.length > 0) {
    const sets = entries.map(([k]) => `${k} = ?`).join(', ');
    const values = entries.map(([k, v]) => (BOOLEAN_KEYS.has(k) ? (v ? 1 : 0) : (v as string | number)));
    values.push(nowIso(), req.auth!.userId);
    await exec(`UPDATE user_settings SET ${sets}, updated_at = ? WHERE user_id = ?`, values);
  }
  const settings = await one('SELECT * FROM user_settings WHERE user_id = ?', [req.auth!.userId]);
  res.json({ settings });
}));
