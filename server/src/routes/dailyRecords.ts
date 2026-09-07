import { Router } from 'express';
import { z } from 'zod';
import { exec, query } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { randomId } from '../lib/ids.js';
import { nowIso, todayDate } from '../lib/time.js';
import { writeAudit } from '../lib/audit.js';
import { notifyProjectMembers } from '../services/notify.js';

export const dailyRecordsRouter = Router({ mergeParams: true });

/** List daily records, optionally filtered by component/date (Req 13.2). */
dailyRecordsRouter.get('/', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  const projectId = req.params.projectId;
  const componentId = req.query.componentId ? String(req.query.componentId) : null;
  const records = componentId
    ? await query('SELECT * FROM daily_records WHERE project_id = ? AND component_id = ? ORDER BY record_date DESC, created_at DESC', [projectId, componentId])
    : await query('SELECT * FROM daily_records WHERE project_id = ? ORDER BY record_date DESC, created_at DESC', [projectId]);
  res.json({ records });
}));

const recordSchema = z.object({
  componentId: z.string().trim().nullable().optional(),
  recordDate: z.string().trim().optional(),
  workCompleted: z.string().trim().max(2000).optional(),
  materialsUsed: z.string().trim().max(2000).optional(),
  peoplePresent: z.string().trim().max(2000).optional(),
  progress: z.number().min(0).max(100).nullable().optional(),
  issues: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

/** Create a daily site record (Req 13.1) — distinct from the audit log. */
dailyRecordsRouter.post('/', requireAuth, requirePermission('create_daily_record'), validateBody(recordSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof recordSchema>;
  const projectId = req.params.projectId;
  const id = randomId();
  await exec(
    `INSERT INTO daily_records (id, project_id, component_id, record_date, work_completed, materials_used, people_present, progress, issues, notes, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, projectId, body.componentId ?? null, body.recordDate ?? todayDate(),
      body.workCompleted ?? null, body.materialsUsed ?? null, body.peoplePresent ?? null,
      body.progress ?? null, body.issues ?? null, body.notes ?? null, req.auth!.userId, nowIso(),
    ],
  );
  await writeAudit({
    projectId,
    componentId: body.componentId ?? null,
    actorUserId: req.auth!.userId,
    action: 'daily_record.create',
    entityType: 'daily_record',
    entityId: id,
    after: { date: body.recordDate ?? todayDate() },
  });
  await notifyProjectMembers(projectId, 'daily_record', 'Daily record submitted', 'A daily site record was added.', req.auth!.userId);
  res.status(201).json({ id });
}));
