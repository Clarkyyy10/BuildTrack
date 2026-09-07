import { Router } from 'express';
import { z } from 'zod';
import { one, exec, query } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { validateBody } from '../middleware/validate.js';
import { ah } from '../lib/http.js';
import { randomId } from '../lib/ids.js';
import { nowIso } from '../lib/time.js';
import { writeAudit } from '../lib/audit.js';
import { notFound } from '../lib/errors.js';
import { notifyProjectMembers } from '../services/notify.js';

export const personnelRouter = Router({ mergeParams: true });

interface PersonnelRow {
  id: string;
  component_id: string;
  user_id: string | null;
  person_name: string;
  site_role: string;
  is_lead: number;
  start_date: string | null;
  end_date: string | null;
}

/** List personnel assigned to a component (Req 12.5). */
personnelRouter.get('/', requireAuth, requirePermission('view_project'), ah(async (req, res) => {
  const rows = await query<PersonnelRow>(
    'SELECT * FROM personnel_assignments WHERE component_id = ? ORDER BY is_lead DESC, person_name',
    [req.params.componentId],
  );
  res.json({
    personnel: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.person_name,
      role: r.site_role,
      isLead: !!r.is_lead,
      startDate: r.start_date,
      endDate: r.end_date,
    })),
  });
}));

const assignSchema = z.object({
  personName: z.string().trim().min(1).max(160),
  siteRole: z.string().trim().min(1).max(120),
  userId: z.string().trim().nullable().optional(),
  isLead: z.boolean().default(false),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

/** Assign personnel to a component — independent of membership (Req 12.1, 12.2). */
personnelRouter.post('/', requireAuth, requirePermission('manage_personnel'), validateBody(assignSchema), ah(async (req, res) => {
  const body = req.body as z.infer<typeof assignSchema>;
  const componentId = req.params.componentId;
  const id = randomId();
  await exec(
    `INSERT INTO personnel_assignments (id, component_id, user_id, person_name, site_role, is_lead, start_date, end_date, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, componentId, body.userId ?? null, body.personName, body.siteRole, body.isLead ? 1 : 0, body.startDate ?? null, body.endDate ?? null, req.auth!.userId, nowIso()],
  );
  await writeAudit({
    projectId: req.projectId!,
    componentId,
    actorUserId: req.auth!.userId,
    action: 'personnel.add',
    entityType: 'personnel',
    entityId: id,
    after: { name: body.personName, role: body.siteRole },
  });
  await notifyProjectMembers(req.projectId!, 'personnel_change', 'Personnel added', `${body.personName} was assigned as ${body.siteRole}.`, req.auth!.userId);
  res.status(201).json({ id });
}));

personnelRouter.delete('/:assignmentId', requireAuth, requirePermission('manage_personnel'), ah(async (req, res) => {
  const existing = await one<{ person_name: string }>('SELECT person_name FROM personnel_assignments WHERE id = ?', [req.params.assignmentId]);
  if (!existing) throw notFound('That assignment could not be found.');
  await exec('DELETE FROM personnel_assignments WHERE id = ?', [req.params.assignmentId]);
  await writeAudit({
    projectId: req.projectId!,
    componentId: req.params.componentId,
    actorUserId: req.auth!.userId,
    action: 'personnel.remove',
    entityType: 'personnel',
    entityId: req.params.assignmentId,
    before: { name: existing.person_name },
  });
  res.json({ ok: true });
}));
