import { Router } from 'express';
import { z } from 'zod';
import { one, exec, query } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { randomId } from '../lib/ids.js';
import { nowIso, todayDate } from '../lib/time.js';
import { writeAudit } from '../lib/audit.js';
import { notFound } from '../lib/errors.js';
import { notifyProjectMembers } from '../services/notify.js';

export const scheduleRouter = Router({ mergeParams: true });

interface ActivityRow {
  id: string;
  component_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  sort_order: number;
}

/** Component schedule: fields + activities as list/timeline + current phase (Req 11.3). */
scheduleRouter.get('/', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  const componentId = req.params.componentId;
  const component = await one<{ start_date: string | null; end_date: string | null; status: string; progress: number }>(
    'SELECT start_date, end_date, status, progress FROM project_components WHERE id = ?',
    [componentId],
  );
  if (!component) throw notFound('That component could not be found.');

  const activities = await query<ActivityRow>(
    'SELECT * FROM schedule_activities WHERE component_id = ? ORDER BY sort_order, start_date',
    [componentId],
  );

  const today = todayDate();
  const currentPhase = activities.find((a) => (a.start_date ?? '') <= today && today <= (a.end_date ?? '9999'));

  res.json({
    schedule: {
      startDate: component.start_date,
      endDate: component.end_date,
      status: component.status,
      progress: component.progress,
    },
    activities: activities.map((a) => ({
      id: a.id,
      name: a.name,
      startDate: a.start_date,
      endDate: a.end_date,
      status: a.status,
    })),
    currentPhase: currentPhase
      ? { id: currentPhase.id, name: currentPhase.name, startDate: currentPhase.start_date, endDate: currentPhase.end_date }
      : null,
  });
}));

const activitySchema = z.object({
  name: z.string().trim().min(1).max(160),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  status: z.enum(['planned', 'in_progress', 'completed']).default('planned'),
});

scheduleRouter.post('/activities', requireAuth, requirePermission('manage_schedule'), validateBody(activitySchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof activitySchema>;
  const componentId = req.params.componentId;
  const nextRow = await one<{ n: number }>('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM schedule_activities WHERE component_id = ?', [componentId]);
  const id = randomId();
  const ts = nowIso();
  await exec(
    `INSERT INTO schedule_activities (id, component_id, name, start_date, end_date, status, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, componentId, body.name, body.startDate ?? null, body.endDate ?? null, body.status, nextRow?.n ?? 0, ts, ts],
  );
  await writeAudit({
    projectId: req.projectId!,
    componentId,
    actorUserId: req.auth!.userId,
    action: 'schedule.activity_add',
    entityType: 'schedule_activity',
    entityId: id,
    after: { name: body.name },
  });
  await notifyProjectMembers(req.projectId!, 'schedule_change', 'Schedule updated', 'A schedule activity was added.', req.auth!.userId);
  res.status(201).json({ id });
}));

const activityUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  startDate: z.string().trim().nullable().optional(),
  endDate: z.string().trim().nullable().optional(),
  status: z.enum(['planned', 'in_progress', 'completed']).optional(),
});

scheduleRouter.patch('/activities/:activityId', requireAuth, requirePermission('manage_schedule'), validateBody(activityUpdateSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof activityUpdateSchema>;
  const { activityId } = req.params;
  const existing = await one('SELECT id FROM schedule_activities WHERE id = ?', [activityId]);
  if (!existing) throw notFound('That activity could not be found.');

  await exec(
    `UPDATE schedule_activities SET
       name = COALESCE(?, name),
       start_date = COALESCE(?, start_date),
       end_date = COALESCE(?, end_date),
       status = COALESCE(?, status),
       updated_at = ?
     WHERE id = ?`,
    [body.name ?? null, body.startDate ?? null, body.endDate ?? null, body.status ?? null, nowIso(), activityId],
  );
  await writeAudit({
    projectId: req.projectId!,
    componentId: req.params.componentId,
    actorUserId: req.auth!.userId,
    action: 'schedule.activity_update',
    entityType: 'schedule_activity',
    entityId: activityId,
    after: body,
  });
  res.json({ ok: true });
}));

scheduleRouter.delete('/activities/:activityId', requireAuth, requirePermission('manage_schedule'), ah(async (req, res) => {
  await exec('DELETE FROM schedule_activities WHERE id = ?', [req.params.activityId]);
  await writeAudit({
    projectId: req.projectId!,
    componentId: req.params.componentId,
    actorUserId: req.auth!.userId,
    action: 'schedule.activity_delete',
    entityType: 'schedule_activity',
    entityId: req.params.activityId,
  });
  res.json({ ok: true });
}));
