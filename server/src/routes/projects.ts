import { Router } from 'express';
import { z } from 'zod';
import { one, exec, query } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { newProjectId, randomId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { writeAudit } from '../lib/audit.js';
import { notFound, badRequest } from '../lib/errors.js';
import { templateFor } from '../services/templates.js';
import { insertTemplate } from '../services/components.js';
import { computeProjectProgress, type ProgressMethod } from '../services/progress.js';
import { projectApprovedBudget, projectSpent } from '../services/stats.js';
import { ALL_ROLES, type Role } from '../services/permissions.js';
import { findUserById } from '../services/users.js';

export const projectsRouter = Router();

interface ProjectRow {
  id: string;
  name: string;
  type: string;
  location: string | null;
  status: string;
  progress_method: ProgressMethod;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function getProject(id: string): Promise<ProjectRow | undefined> {
  return one<ProjectRow>('SELECT * FROM projects WHERE id = ?', [id]);
}

async function serializeProject(p: ProjectRow, role: string | null) {
  const approved = await projectApprovedBudget(p.id);
  const spent = await projectSpent(p.id);
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    location: p.location,
    status: p.status,
    progressMethod: p.progress_method,
    progress: await computeProjectProgress(p.id, p.progress_method),
    budget: { approved, spent, remaining: approved - spent },
    role,
    createdBy: p.created_by,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

/** List projects the user is a member of (Req 3.2). */
projectsRouter.get('/', requireAuth, ah(async (req, res) => {
  const rows = await query<ProjectRow & { my_role: string }>(
    `SELECT p.*, m.role AS my_role
     FROM projects p JOIN project_members m ON m.project_id = p.id
     WHERE m.user_id = ?
     ORDER BY p.updated_at DESC`,
    [req.auth!.userId],
  );
  const projects = await Promise.all(rows.map((r) => serializeProject(r, r.my_role)));
  res.json({ projects });
}));

const createSchema = z.object({
  name: z.string().trim().min(1).max(160),
  type: z.enum(['residential', 'commercial', 'road', 'custom']).default('custom'),
  location: z.string().trim().max(200).optional(),
  useTemplate: z.boolean().default(true),
});

/** Create a project; creator becomes Project Manager; optional template (Req 3.1, 3.5). */
projectsRouter.post('/', requireAuth, validateBody(createSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const userId = req.auth!.userId;

  const projectId = await newProjectId();
  const ts = nowIso();
  await exec(
    `INSERT INTO projects (id, name, type, location, status, progress_method, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'planning', 'budget_weighted', ?, ?, ?)`,
    [projectId, body.name, body.type, body.location ?? null, userId, ts, ts],
  );
  await exec(
    `INSERT INTO project_members (id, project_id, user_id, role, added_by, created_at)
     VALUES (?, ?, ?, 'project_manager', ?, ?)`,
    [randomId(), projectId, userId, userId, ts],
  );
  if (body.useTemplate) {
    await insertTemplate(projectId, templateFor(body.type), null, userId);
  }
  await writeAudit({
    projectId,
    actorUserId: userId,
    action: 'project.create',
    entityType: 'project',
    entityId: projectId,
    after: { name: body.name, type: body.type },
  });

  res.status(201).json({ project: await serializeProject((await getProject(projectId))!, 'project_manager') });
}));

/** Project overview. */
projectsRouter.get('/:projectId', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  const p = await getProject(req.params.projectId);
  if (!p) throw notFound('That project could not be found.');
  res.json({ project: await serializeProject(p, req.memberRole ?? null) });
}));

const updateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  location: z.string().trim().max(200).nullable().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed']).optional(),
  type: z.enum(['residential', 'commercial', 'road', 'custom']).optional(),
  progressMethod: z
    .enum(['budget_weighted', 'simple_average', 'quantity_weighted', 'manual'])
    .optional(),
});

projectsRouter.patch('/:projectId', requireAuth, requirePermission('edit_project'), validateBody(updateSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof updateSchema>;
  const p = await getProject(req.params.projectId);
  if (!p) throw notFound('That project could not be found.');

  await exec(
    `UPDATE projects SET
       name = COALESCE(?, name),
       location = COALESCE(?, location),
       status = COALESCE(?, status),
       type = COALESCE(?, type),
       progress_method = COALESCE(?, progress_method),
       updated_at = ?
     WHERE id = ?`,
    [
      body.name ?? null,
      body.location ?? null,
      body.status ?? null,
      body.type ?? null,
      body.progressMethod ?? null,
      nowIso(),
      p.id,
    ],
  );
  await writeAudit({
    projectId: p.id,
    actorUserId: req.auth!.userId,
    action: 'project.update',
    entityType: 'project',
    entityId: p.id,
    before: { name: p.name, status: p.status },
    after: body,
  });
  res.json({ project: await serializeProject((await getProject(p.id))!, req.memberRole ?? null) });
}));

/** Members list. */
projectsRouter.get('/:projectId/members', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  const rows = await query<{
    user_id: string;
    role: string;
    created_at: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    `SELECT m.user_id, m.role, m.created_at, u.display_name, u.avatar_url
     FROM project_members m JOIN users u ON u.id = m.user_id
     WHERE m.project_id = ? ORDER BY m.created_at`,
    [req.params.projectId],
  );
  res.json({
    members: rows.map((r) => ({
      userId: r.user_id,
      role: r.role,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
      joinedAt: r.created_at,
    })),
  });
}));

const roleSchema = z.object({ role: z.enum(ALL_ROLES as [Role, ...Role[]]) });

projectsRouter.patch('/:projectId/members/:memberUserId', requireAuth, requirePermission('invite_members'), validateBody(roleSchema), ah(async (req, res) => {
  const { role } = req.body as z.infer<typeof roleSchema>;
  const { projectId, memberUserId } = req.params;
  const existing = await one<{ role: string }>(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, memberUserId],
  );
  if (!existing) throw notFound('That member could not be found.');

  await exec('UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?', [role, projectId, memberUserId]);
  await writeAudit({
    projectId,
    actorUserId: req.auth!.userId,
    action: 'member.role_change',
    entityType: 'member',
    entityId: memberUserId,
    before: { role: existing.role },
    after: { role },
  });
  res.json({ ok: true });
}));

projectsRouter.delete('/:projectId/members/:memberUserId', requireAuth, requirePermission('invite_members'), ah(async (req, res) => {
  const { projectId, memberUserId } = req.params;
  const project = await getProject(projectId);
  if (!project) throw notFound('That project could not be found.');
  if (project.created_by === memberUserId) {
    throw badRequest('The project owner cannot be removed.', 'cannot_remove_owner');
  }
  if (!(await findUserById(memberUserId))) throw notFound('That member could not be found.');

  await exec('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, memberUserId]);
  await writeAudit({
    projectId,
    actorUserId: req.auth!.userId,
    action: 'member.remove',
    entityType: 'member',
    entityId: memberUserId,
  });
  res.json({ ok: true });
}));
