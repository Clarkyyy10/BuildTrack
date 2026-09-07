import { Router } from 'express';
import { exec, query } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { ah } from '../lib/http.js';
import { nowIso } from '../lib/time.js';

export const notificationsRouter = Router();

/** List the current user's notifications (Req 15.3). */
notificationsRouter.get('/', requireAuth, ah(async (req, res) => {
  const rows = await query<{
    id: string;
    project_id: string | null;
    type: string;
    title: string;
    body: string | null;
    is_read: number;
    created_at: string;
  }>('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [req.auth!.userId]);
  const unread = rows.filter((r) => !r.is_read).length;
  res.json({
    unread,
    notifications: rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      type: r.type,
      title: r.title,
      body: r.body,
      isRead: !!r.is_read,
      createdAt: r.created_at,
    })),
  });
}));

/** Mark a single notification as read. */
notificationsRouter.post('/:notificationId/read', requireAuth, ah(async (req, res) => {
  await exec('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.notificationId, req.auth!.userId]);
  res.json({ ok: true });
}));

/** Mark all as read. */
notificationsRouter.post('/read-all', requireAuth, ah(async (req, res) => {
  await exec('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.auth!.userId]);
  res.json({ ok: true, at: nowIso() });
}));
