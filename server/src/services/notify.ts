import { exec, query } from '../db/connection.js';
import { randomId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';

/** Creates a notification for a single user (Req 15). */
export async function notifyUser(
  userId: string,
  projectId: string | null,
  type: string,
  title: string,
  body?: string,
): Promise<void> {
  await exec(
    `INSERT INTO notifications (id, user_id, project_id, type, title, body, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [randomId(), userId, projectId, type, title, body ?? null, nowIso()],
  );
}

/** Notifies every member of a project (optionally excluding one user). */
export async function notifyProjectMembers(
  projectId: string,
  type: string,
  title: string,
  body?: string,
  excludeUserId?: string,
): Promise<void> {
  const members = await query<{ user_id: string }>(
    'SELECT user_id FROM project_members WHERE project_id = ?',
    [projectId],
  );
  for (const m of members) {
    if (m.user_id === excludeUserId) continue;
    await notifyUser(m.user_id, projectId, type, title, body);
  }
}
