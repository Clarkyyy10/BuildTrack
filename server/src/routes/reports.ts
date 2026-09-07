import { Router } from 'express';
import { one, query } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { ah } from '../lib/http.js';
import { badRequest } from '../lib/errors.js';
import { getProjectComponents } from '../lib/tree.js';
import { projectApprovedBudget, projectSpent } from '../services/stats.js';
import { computeProjectProgress, type ProgressMethod } from '../services/progress.js';

export const reportsRouter = Router({ mergeParams: true });

const KINDS = ['progress', 'material', 'budget', 'personnel', 'daily', 'activity', 'full'] as const;
type Kind = (typeof KINDS)[number];

/** Project reports computed from current data (Req 16). */
reportsRouter.get('/:kind', requireAuth, requirePermission('view_activity'), ah(async (req, res) => {
  const kind = req.params.kind as Kind;
  if (!KINDS.includes(kind)) throw badRequest('Unknown report type.', 'unknown_report');
  const projectId = req.params.projectId;

  switch (kind) {
    case 'progress': {
      const method = (await one<{ progress_method: ProgressMethod }>('SELECT progress_method FROM projects WHERE id = ?', [projectId]))!.progress_method;
      const components = (await getProjectComponents(projectId)).map((c) => ({
        id: c.id, name: c.name, type: c.component_type, status: c.status, progress: c.progress,
      }));
      return res.json({ kind, overall: await computeProjectProgress(projectId, method), components });
    }
    case 'budget': {
      const approved = await projectApprovedBudget(projectId);
      const spent = await projectSpent(projectId);
      const byCategory = await query(
        `SELECT e.category, COALESCE(SUM(e.amount),0) AS amount
         FROM expenses e JOIN project_components c ON c.id = e.component_id
         WHERE c.project_id = ? GROUP BY e.category ORDER BY amount DESC`,
        [projectId],
      );
      return res.json({ kind, approved, spent, remaining: approved - spent, byCategory });
    }
    case 'material': {
      const materials = await query(
        `SELECT m.name, m.unit, m.category, c.name AS component
         FROM materials m JOIN project_components c ON c.id = m.component_id
         WHERE c.project_id = ? ORDER BY c.name, m.name`,
        [projectId],
      );
      return res.json({ kind, materials });
    }
    case 'personnel': {
      const personnel = await query(
        `SELECT pa.person_name, pa.site_role, pa.is_lead, c.name AS component
         FROM personnel_assignments pa JOIN project_components c ON c.id = pa.component_id
         WHERE c.project_id = ? ORDER BY c.name, pa.is_lead DESC`,
        [projectId],
      );
      return res.json({ kind, personnel });
    }
    case 'daily': {
      const records = await query(
        'SELECT record_date, work_completed, issues, component_id FROM daily_records WHERE project_id = ? ORDER BY record_date DESC LIMIT 200',
        [projectId],
      );
      return res.json({ kind, records });
    }
    case 'activity': {
      const activity = await query(
        `SELECT a.action, a.entity_type, a.created_at, u.display_name AS actor
         FROM audit_logs a JOIN users u ON u.id = a.actor_user_id
         WHERE a.project_id = ? ORDER BY a.created_at DESC LIMIT 200`,
        [projectId],
      );
      return res.json({ kind, activity });
    }
    case 'full': {
      const project = (await one<{ id: string; name: string; type: string; location: string | null; status: string; progress_method: ProgressMethod }>(
        'SELECT id, name, type, location, status, progress_method FROM projects WHERE id = ?',
        [projectId],
      ))!;
      const approved = await projectApprovedBudget(projectId);
      const spent = await projectSpent(projectId);
      const byCategory = await query(
        `SELECT e.category, COALESCE(SUM(e.amount),0) AS amount
         FROM expenses e JOIN project_components c ON c.id = e.component_id
         WHERE c.project_id = ? GROUP BY e.category ORDER BY amount DESC`,
        [projectId],
      );
      const components = (await getProjectComponents(projectId)).map((c) => ({
        id: c.id, name: c.name, type: c.component_type, status: c.status,
        progress: c.progress, approvedBudget: c.approved_budget, parentId: c.parent_id,
      }));
      const materials = await query(
        `SELECT m.name, m.unit, m.category, m.total_needed, m.unit_cost, c.name AS component
         FROM materials m JOIN project_components c ON c.id = m.component_id
         WHERE c.project_id = ? ORDER BY c.name, m.name`,
        [projectId],
      );
      const personnel = await query(
        `SELECT pa.person_name, pa.site_role, pa.is_lead, c.name AS component
         FROM personnel_assignments pa JOIN project_components c ON c.id = pa.component_id
         WHERE c.project_id = ? ORDER BY c.name, pa.is_lead DESC`,
        [projectId],
      );
      const daily = await query(
        `SELECT d.record_date, d.work_completed, d.issues, c.name AS component
         FROM daily_records d LEFT JOIN project_components c ON c.id = d.component_id
         WHERE d.project_id = ? ORDER BY d.record_date DESC LIMIT 100`,
        [projectId],
      );
      return res.json({
        kind,
        generatedAt: new Date().toISOString(),
        project,
        overall: await computeProjectProgress(projectId, project.progress_method),
        budget: { approved, spent, remaining: approved - spent, byCategory },
        components,
        materials,
        personnel,
        daily,
      });
    }
  }
}));
