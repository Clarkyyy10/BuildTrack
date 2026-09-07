import { Router } from 'express';
import { query } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { ah } from '../lib/http.js';

export const projectActivityRouter = Router({ mergeParams: true });
export const historyRouter = Router();

interface AuditView {
  id: string;
  project_id: string;
  component_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_json: string | null;
  after_json: string | null;
  created_at: string;
  actor_user_id: string;
  actor_name: string;
  component_name: string | null;
}

function serialize(r: AuditView) {
  return {
    id: r.id,
    projectId: r.project_id,
    componentId: r.component_id,
    componentName: r.component_name,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    actorUserId: r.actor_user_id,
    actorName: r.actor_name,
    before: r.before_json ? JSON.parse(r.before_json) : null,
    after: r.after_json ? JSON.parse(r.after_json) : null,
    createdAt: r.created_at,
  };
}

/** Project activity log — append-only, permitted members (Req 14.2). */
projectActivityRouter.get('/', requireAuth, requirePermission('view_activity'), ah(async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 200);
  const rows = await query<AuditView>(
    `SELECT a.*, u.display_name AS actor_name, c.name AS component_name
     FROM audit_logs a
     JOIN users u ON u.id = a.actor_user_id
     LEFT JOIN project_components c ON c.id = a.component_id
     WHERE a.project_id = ?
     ORDER BY a.created_at DESC LIMIT ?`,
    [req.params.projectId, limit],
  );
  res.json({ activity: rows.map(serialize) });
}));

/** Global history across all of the user's projects (Req 14.3). */
historyRouter.get('/', requireAuth, ah(async (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 200);
  const rows = await query<AuditView>(
    `SELECT a.*, u.display_name AS actor_name, c.name AS component_name
     FROM audit_logs a
     JOIN users u ON u.id = a.actor_user_id
     LEFT JOIN project_components c ON c.id = a.component_id
     WHERE a.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)
     ORDER BY a.created_at DESC LIMIT ?`,
    [req.auth!.userId, limit],
  );
  res.json({ activity: rows.map(serialize) });
}));
