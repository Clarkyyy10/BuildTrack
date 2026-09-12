import { Router } from 'express';
import { z } from 'zod';
import { one, exec } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { nowIso } from '../lib/time.js';
import { writeAudit } from '../lib/audit.js';
import { badRequest, notFound } from '../lib/errors.js';
import {
  buildTree,
  getProjectComponents,
  isSelfOrDescendant,
  type ComponentNode,
  type ComponentRow,
} from '../lib/tree.js';
import { createComponent } from '../services/components.js';
import { computeProgress, type ProgressMethod } from '../services/progress.js';
import { componentBudgetSummary } from '../services/stats.js';

export const projectComponentsRouter = Router({ mergeParams: true });
export const componentsRouter = Router();

async function projectMethod(projectId: string): Promise<ProgressMethod> {
  const row = await one<{ progress_method: ProgressMethod }>(
    'SELECT progress_method FROM projects WHERE id = ?',
    [projectId],
  );
  return row?.progress_method ?? 'budget_weighted';
}

function getComponent(id: string): Promise<ComponentRow | undefined> {
  return one<ComponentRow>('SELECT * FROM project_components WHERE id = ?', [id]);
}

async function serializeNode(node: ComponentNode, method: ProgressMethod): Promise<unknown> {
  const children = [];
  for (const c of node.children) children.push(await serializeNode(c, method));
  return {
    id: node.id,
    parentId: node.parent_id,
    name: node.name,
    type: node.component_type,
    status: node.status,
    sortOrder: node.sort_order,
    progress: Math.round(await computeProgress(node, method)),
    directProgress: node.progress,
    approvedBudget: node.approved_budget,
    startDate: node.start_date,
    endDate: node.end_date,
    children,
  };
}

function findNode(nodes: ComponentNode[], id: string): ComponentNode | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return undefined;
}

/** Full breakdown tree with rolled-up progress (Req 6, 8). */
projectComponentsRouter.get('/', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  const projectId = req.params.projectId;
  const method = await projectMethod(projectId);
  const tree = buildTree(await getProjectComponents(projectId));
  const components = await Promise.all(tree.map((n) => serializeNode(n, method)));
  res.json({ components });
}));

const createSchema = z.object({
  name: z.string().trim().min(1).max(160),
  componentType: z
    .enum(['building', 'floor', 'area', 'room', 'phase', 'trade', 'work', 'task', 'custom'])
    .default('custom'),
  parentId: z.string().trim().nullable().optional(),
  approvedBudget: z.number().min(0).optional(),
});

projectComponentsRouter.post('/', requireAuth, requirePermission('manage_components'), validateBody(createSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const projectId = req.params.projectId;

  if (body.parentId) {
    const parent = await getComponent(body.parentId);
    if (!parent || parent.project_id !== projectId) {
      throw badRequest('The chosen parent component is invalid.', 'invalid_parent');
    }
  }

  const id = await createComponent(
    {
      projectId,
      parentId: body.parentId ?? null,
      name: body.name,
      componentType: body.componentType,
      approvedBudget: body.approvedBudget,
    },
    req.auth!.userId,
  );
  res.status(201).json({ id });
}));

/** Component summary (Req 7.2). */
componentsRouter.get('/:componentId', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  const c = await getComponent(req.params.componentId);
  if (!c) throw notFound('That component could not be found.');

  const method = await projectMethod(c.project_id);
  const node = findNode(buildTree(await getProjectComponents(c.project_id)), c.id);

  const teamRow = await one<{ n: number }>('SELECT COUNT(*) AS n FROM personnel_assignments WHERE component_id = ?', [c.id]);
  const matRow = await one<{ n: number }>('SELECT COUNT(*) AS n FROM materials WHERE component_id = ?', [c.id]);
  const childRow = await one<{ n: number }>('SELECT COUNT(*) AS n FROM project_components WHERE parent_id = ?', [c.id]);

  res.json({
    component: {
      id: c.id,
      projectId: c.project_id,
      parentId: c.parent_id,
      name: c.name,
      type: c.component_type,
      status: c.status,
      progress: node ? Math.round(await computeProgress(node, method)) : c.progress,
      directProgress: c.progress,
      childCount: childRow?.n ?? 0,
      startDate: c.start_date,
      endDate: c.end_date,
      teamCount: teamRow?.n ?? 0,
      materialCount: matRow?.n ?? 0,
      budget: await componentBudgetSummary(c.id),
    },
  });
}));

const editSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  componentType: z
    .enum(['building', 'floor', 'area', 'room', 'phase', 'trade', 'work', 'task', 'custom'])
    .optional(),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed']).optional(),
  weight: z.number().min(0).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

componentsRouter.patch('/:componentId', requireAuth, requirePermission('manage_components'), validateBody(editSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof editSchema>;
  const c = await getComponent(req.params.componentId);
  if (!c) throw notFound('That component could not be found.');

  await exec(
    `UPDATE project_components SET
       name = COALESCE(?, name),
       component_type = COALESCE(?, component_type),
       status = COALESCE(?, status),
       weight = COALESCE(?, weight),
       start_date = COALESCE(?, start_date),
       end_date = COALESCE(?, end_date),
       updated_at = ?
     WHERE id = ?`,
    [
      body.name ?? null,
      body.componentType ?? null,
      body.status ?? null,
      body.weight ?? null,
      body.startDate ?? null,
      body.endDate ?? null,
      nowIso(),
      c.id,
    ],
  );
  await writeAudit({
    projectId: c.project_id,
    componentId: c.id,
    actorUserId: req.auth!.userId,
    action: 'component.update',
    entityType: 'component',
    entityId: c.id,
    before: { name: c.name, status: c.status },
    after: body,
  });
  res.json({ ok: true });
}));

const progressSchema = z.object({ progress: z.number().min(0).max(100) });

/** Update a component's direct progress (Req 8.1). */
componentsRouter.patch('/:componentId/progress', requireAuth, requirePermission('update_progress'), validateBody(progressSchema), ah(async (req, res) => {
  const { progress } = req.body as z.infer<typeof progressSchema>;
  const c = await getComponent(req.params.componentId);
  if (!c) throw notFound('That component could not be found.');

  await exec('UPDATE project_components SET progress = ?, updated_at = ? WHERE id = ?', [progress, nowIso(), c.id]);
  await writeAudit({
    projectId: c.project_id,
    componentId: c.id,
    actorUserId: req.auth!.userId,
    action: 'progress.update',
    entityType: 'component',
    entityId: c.id,
    before: { progress: c.progress },
    after: { progress },
  });
  res.json({ ok: true });
}));

const moveSchema = z.object({ parentId: z.string().trim().nullable() });

/** Reparent a component; rejects cycles (Req 6.4, 6.5). */
componentsRouter.post('/:componentId/move', requireAuth, requirePermission('manage_components'), validateBody(moveSchema), ah(async (req, res) => {
  const { parentId } = req.body as z.infer<typeof moveSchema>;
  const c = await getComponent(req.params.componentId);
  if (!c) throw notFound('That component could not be found.');

  if (parentId) {
    const parent = await getComponent(parentId);
    if (!parent || parent.project_id !== c.project_id) {
      throw badRequest('The chosen parent component is invalid.', 'invalid_parent');
    }
    if (await isSelfOrDescendant(c.id, parentId)) {
      throw badRequest('A component cannot be moved inside itself.', 'cycle');
    }
  }

  const nextRow = await one<{ n: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS n
     FROM project_components WHERE project_id = ? AND parent_id IS NOT DISTINCT FROM ?`,
    [c.project_id, parentId],
  );
  await exec('UPDATE project_components SET parent_id = ?, sort_order = ?, updated_at = ? WHERE id = ?', [parentId, nextRow?.n ?? 0, nowIso(), c.id]);
  await writeAudit({
    projectId: c.project_id,
    componentId: c.id,
    actorUserId: req.auth!.userId,
    action: 'component.move',
    entityType: 'component',
    entityId: c.id,
    before: { parentId: c.parent_id },
    after: { parentId },
  });
  res.json({ ok: true });
}));

const reorderSchema = z.object({ orderedIds: z.array(z.string()).min(1) });

/** Reorder siblings (Req 6.6). */
componentsRouter.post('/:componentId/reorder', requireAuth, requirePermission('manage_components'), validateBody(reorderSchema), ah(async (req, res) => {
  const { orderedIds } = req.body as z.infer<typeof reorderSchema>;
  const c = await getComponent(req.params.componentId);
  if (!c) throw notFound('That component could not be found.');

  const ts = nowIso();
  for (let index = 0; index < orderedIds.length; index++) {
    await exec(
      'UPDATE project_components SET sort_order = ?, updated_at = ? WHERE id = ? AND project_id = ? AND parent_id IS NOT DISTINCT FROM ?',
      [index, ts, orderedIds[index], c.project_id, c.parent_id],
    );
  }
  res.json({ ok: true });
}));

/** Delete a component and its descendants (cascade) — Req 6.7. */
componentsRouter.delete('/:componentId', requireAuth, requirePermission('manage_components'), ah(async (req, res) => {
  const c = await getComponent(req.params.componentId);
  if (!c) throw notFound('That component could not be found.');

  await exec('DELETE FROM project_components WHERE id = ?', [c.id]);
  await writeAudit({
    projectId: c.project_id,
    actorUserId: req.auth!.userId,
    action: 'component.delete',
    entityType: 'component',
    entityId: c.id,
    before: { name: c.name },
  });
  res.json({ ok: true });
}));
