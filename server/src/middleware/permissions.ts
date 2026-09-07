import type { Request } from 'express';
import { one } from '../db/connection.js';
import { forbidden, notFound, unauthorized } from '../lib/errors.js';
import { ah } from '../lib/http.js';
import {
  getMemberRole,
  roleHasPermission,
  type Permission,
  type Role,
} from '../services/permissions.js';

/**
 * Resolves the target project (and component, when relevant) from route
 * params, following the chain material -> component -> project as needed.
 */
async function resolveContext(req: Request): Promise<{ projectId: string; componentId?: string }> {
  const p = req.params;

  if (p.projectId) return { projectId: p.projectId };

  if (p.componentId) {
    const row = await one<{ project_id: string }>(
      'SELECT project_id FROM project_components WHERE id = ?',
      [p.componentId],
    );
    if (!row) throw notFound('That component could not be found.');
    return { projectId: row.project_id, componentId: p.componentId };
  }

  if (p.materialId) {
    const row = await one<{ projectId: string; componentId: string }>(
      `SELECT c.project_id AS "projectId", m.component_id AS "componentId"
       FROM materials m JOIN project_components c ON c.id = m.component_id
       WHERE m.id = ?`,
      [p.materialId],
    );
    if (!row) throw notFound('That material could not be found.');
    return { projectId: row.projectId, componentId: row.componentId };
  }

  throw notFound('No project context could be resolved for this request.');
}

/**
 * Server-side authorization (Req 4, 18.1, 18.6). Resolves the project,
 * verifies membership, and checks the required permission against the
 * role matrix — independent of any UI state.
 */
export function requirePermission(perm: Permission) {
  return ah(async (req, _res, next) => {
    if (!req.auth) return next(unauthorized());

    const ctx = await resolveContext(req);
    const role = await getMemberRole(ctx.projectId, req.auth.userId);
    if (!role) return next(forbidden('You are not a member of this project.'));
    if (!roleHasPermission(role as Role, perm)) return next(forbidden());

    req.projectId = ctx.projectId;
    req.componentId = ctx.componentId;
    req.memberRole = role;
    next();
  });
}
